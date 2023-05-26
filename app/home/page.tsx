import Search from "./search";
import Footer from "./footer";
import Goods from "./skuList";

export default function Home() {

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Search />
      <Goods />
      <Footer/>
    </main>
  )
}
