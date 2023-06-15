// 画面表示時の顧客番号編集不可
kintone.events.on(
  ["app.record.create.show", "app.record.edit.show"],
  (event) => {
    const record = event.record;
    record["顧客番号"].disabled = true;
    if (record["顧客番号"].value === undefined) {
      const appId = event.appId;
      const body = {
        app: appId,
        query: `order by 顧客番号 desc limit 1`,
      };
      return kintone
        .api(kintone.api.url("/k/v1/records", true), "GET", body)
        .then((resp) => {
          record["顧客番号"].value =
            resp.records.length === 1
              ? Number(resp.records[0]["顧客番号"].value) + 1
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
