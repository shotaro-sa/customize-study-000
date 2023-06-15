kintone.events.on(
  ["app.record.create.submit", "app.record.edit.submit"],
  async (event) => {
    const appId = event.appId;
    const record = event.record;
    const prodMasterAppId = kintone.app.getLookupTargetAppId("商品番号");
    try {
      // 在庫データ取得
      const body = {
        app: prodMasterAppId,
        query: `商品番号 = "${record.商品番号.value}" order by $id desc`,
      };
      const resp = await kintone.api(
        kintone.api.url("/k/v1/records", true),
        "GET",
        body
      );
      const productMasterRecord = resp.records[0];
      const num =
        Number(productMasterRecord.在庫数量.value) +
        Number(record.入荷数量.value);

      // 在庫データ更新と入庫データの登録を一括で実施
      const bulkBody = {
        requests: [
          {
            method: "PUT",
            api: "/k/v1/record.json",
            payload: {
              app: prodMasterAppId,
              id: productMasterRecord.$id.value,
              revision: productMasterRecord.$revision.value,
              record: {
                在庫数量: {
                  value: String(num),
                },
              },
            },
          },
          {
            method: "POST",
            api: "/k/v1/record.json",
            payload: {
              app: appId,
              record: {
                商品番号: record.商品番号,
                入荷数量: record.入荷数量,
                メモ: record.メモ,
              },
            },
          },
        ],
      };
      const bulkResp = await kintone.api(
        kintone.api.url("/k/v1/bulkRequest.json", true),
        "POST",
        bulkBody
      );
      alert(
        `商品番号${record.商品番号.value}[${record.商品名.value}]の在庫を更新しました。` +
          `今の在庫数は${num}です。`
      );
      window.location.href = `/k/${appId}/`; // 通常の遷移
      return false;
    } catch (error) {
      console.log(error);
      event.error = "入荷に失敗しました。";
      return event;
    }
  }
);
