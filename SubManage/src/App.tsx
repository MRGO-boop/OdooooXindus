import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";

import HomePage from "./pages/HomePage";
import Shop from "./pages/Shop";
import Subscriptions from "./pages/Subscriptions";
import Products from "./pages/Products";

function App() {
  return (
    <>
      <NavBar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/subs" element={<Subscriptions />} />
        <Route
          path="/products"
          element={
            <Products
              product={{
                name: "Netflix",
                description: "Binge it all at once",
                image: "Image PLaceholder",
                plans: [],
              }}
            />
          }
        />
      </Routes>
    </>
  );
}

export default App;
