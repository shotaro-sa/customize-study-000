// 画面表示時
kintone.events.on(
  ["app.record.create.show", "app.record.edit.show"],
  (event) => {
    const record = event.record;
    // 編集不可設定
    record["受注番号"].disabled = true;
    record["税抜合計"].disabled = true;
    record["消費税"].disabled = true;
    record["税込合計"].disabled = true;
    // ルックアップ更新
    if (record.顧客番号.value !== undefined) record.顧客番号.lookup = true;
    record.商品一覧.value.forEach((element) => {
      if (element.value.商品番号.value !== undefined)
        element.value.商品番号.lookup = true;
    });
    // 番号採番
    if (record["受注番号"].value === undefined) {
      const appId = event.appId;
      const body = {
        app: appId,
        query: `order by 受注番号 desc limit 1`,
      };
      return kintone
        .api(kintone.api.url("/k/v1/records", true), "GET", body)
        .then((resp) => {
          record["受注番号"].value =
            resp.records.length === 1
              ? Number(resp.records[0]["受注番号"].value) + 1
              : 1;
          return event;
        })
        .catch((error) => {
          alert(error.message);
          return event;
        });
    }
    return event;
  }
);
// 保存時のテーブル金額集計
kintone.events.on(
  ["app.record.create.submit", "app.record.edit.submit"],
  (event) => {
    const record = event.record;
    const sub_total = record.商品一覧.value.reduce((result, current) => {
      return result + Number(current.value.小計.value);
    }, 0);
    record.税抜合計.value = sub_total;
    record.消費税.value = sub_total * 0.1;
    record.税込合計.value = sub_total + record.消費税.value;
    return event;
  }
);
// ステータス変更時の在庫引当
kintone.events.on(["app.record.detail.process.proceed"], async (event) => {
  const record = event.record;
  try {
    // 商品番号リスト作成(Setで重複削除)
    const prodCodeList = [
      ...new Set(
        record.商品一覧.value.map((item) => item.value.商品番号.value)
      ),
    ];
    // 商品マスタよりデータ取得
    const prodMasterAppId = kintone.app.getLookupTargetAppId("商品番号");
    const body = {
      app: prodMasterAppId,
      query: `商品番号 in ("${prodCodeList.join(
        '", "'
      )}") order by 商品番号 asc`,
    };

    const { records } = await kintone.api(
      kintone.api.url("/k/v1/records", true),
      "GET",
      body
    );
    // 引当後の在庫数リスト作成
    const stockData = records.map((prodMasterRecord) => {
      // 商品一覧から商品番号が一致する数量を集計して引当数を計算
      const subtotal = record.商品一覧.value.reduce((result, current) => {
        if (current.value.商品番号.value === prodMasterRecord.商品番号.value) {
          result += Number(current.value.数量.value);
        }
        return result;
      }, 0);
      // 集計値（引当数）が在庫数を超えていればエラー
      if (prodMasterRecord.在庫数量.value < subtotal) {
        event.error =
          `商品番号${prodMasterRecord.商品番号.value}[${prodMasterRecord.商品名.value}]の在庫が足りません。` +
          `今の在庫数は${prodMasterRecord.在庫数量.value}です。`;
      }
      // 在庫数 - 引当数をリターン
      return Number(prodMasterRecord.在庫数量.value) - subtotal;
    });
    // エラー発生（=在庫不足）の場合リターン
    if (event.error !== undefined) {
      return event;
    }
    // 更新用データ作成
    const putBody = {
      app: prodMasterAppId,
      records: resp.records.map((prodRecord, index) => {
        return {
          id: prodRecord.$id.value,
          revision: prodRecord.$revision.value,
          record: {
            在庫数量: {
              value: stockData[index],
            },
          },
        };
      }),
    };
    // 更新実行
    await kintone.api(kintone.api.url("/k/v1/records", true), "PUT", putBody);
    // メッセージ表示
    const msg =
      "在庫引当が完了しました。\n" +
      records
        .map((prodMasterRecord, index) => {
          return (
            `  商品番号${prodMasterRecord.商品番号.value}[${prodMasterRecord.商品名.value}] ` +
            `${prodMasterRecord.在庫数量.value} -> ${stockData[index]}\n`
          );
        })
        .join("");
    alert(msg);
  } catch (error) {
    console.log(error);
    event.error = "入金確認に失敗しました。";
  }
  return event;
});
