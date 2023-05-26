export default function Sku() {

  return (
    <div className="card card-compact w-96 bg-base-100 shadow-xl">
      <figure><img src="https://tailwindui.com/img/ecommerce-images/product-page-01-related-product-01.jpg" alt="Shoes" /></figure>
      <div className="card-body">
        <h2 className="card-title">Shoes!</h2>
        <p>If a dog chews shoes whose shoes does he choose?</p>
        <div className="card-actions justify-end">
          <button className="btn btn-primary">Buy Now</button>
        </div>
      </div>
    </div>
  )
}
