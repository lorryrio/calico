import Sku from "./sku";
export default function Goods() {
  const skuList = [
    {
      title: '标题',
      subTitle: '子标题',
      price: '998'
    },
    {
      title: '标题',
      subTitle: '子标题',
      price: '998'
    },
    {
      title: '标题',
      subTitle: '子标题',
      price: '998'
    },
    {
      title: '标题',
      subTitle: '子标题',
      price: '998'
    },
    {
      title: '标题',
      subTitle: '子标题',
      price: '998'
    },
    {
      title: '标题',
      subTitle: '子标题',
      price: '998'
    },
  ];

  return (
    <div className="artboard artboard-horizontal phone-6">
      <div className="flex gap-4">
        {
          skuList.map(sku => (<Sku />))
        }
      </div>
    </div>
  )
}
