declare namespace kintone.types {
  interface ProdMaster {
    単価: kintone.fieldTypes.Number;
    商品番号: kintone.fieldTypes.Number;
    商品名: kintone.fieldTypes.SingleLineText;
    在庫数量: kintone.fieldTypes.Number;
  }
  interface SavedProdMaster extends ProdMaster {
    $id: kintone.fieldTypes.Id;
    $revision: kintone.fieldTypes.Revision;
    更新者: kintone.fieldTypes.Modifier;
    作成者: kintone.fieldTypes.Creator;
    レコード番号: kintone.fieldTypes.RecordNumber;
    更新日時: kintone.fieldTypes.UpdatedTime;
    作成日時: kintone.fieldTypes.CreatedTime;
  }
}
