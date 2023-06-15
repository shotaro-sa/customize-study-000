// 画面表示時の見積番号編集不可
kintone.events.on(
  ["app.record.create.show", "app.record.edit.show"],
  (event) => {
    const record = event.record;
    record["見積番号"].disabled = true;
    record["税抜合計"].disabled = true;
    record["消費税"].disabled = true;
    record["税込合計"].disabled = true;
    if (record["見積番号"].value === undefined) {
      const appId = event.appId;
      const body = {
        app: appId,
        query: `order by 見積番号 desc limit 1`,
      };
      return kintone
        .api(kintone.api.url("/k/v1/records", true), "GET", body)
        .then((resp) => {
          record["見積番号"].value =
            resp.records.length === 1
              ? Number(resp.records[0]["見積番号"].value) + 1
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
