import { KintoneRestAPIClient } from "@kintone/rest-api-client";

// 画面表示時の商品番号編集不可
kintone.events.on(
  ["app.record.create.show", "app.record.edit.show"],
  (event) => {
    const client = new KintoneRestAPIClient();
    const record: kintone.types.ProdMaster = event.record;
    // 編集不可
    record.商品番号.disabled = true;
    // 採番
    if (record.商品番号.value === undefined) {
      const appId = event.appId;
      return client.record.getRecords({app: appId, query:'order by 商品番号 desc limit 1'})
        .then((resp) => {
          // 最大値の＋１、または１を設定
          record.商品番号.value =
            String(resp.records.length === 1
              ? Number(resp.records[0]["商品番号"].value) + 1
              : 1);
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
