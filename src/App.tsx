import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { HashRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import { AppDataProvider } from "./store/AppDataContext";
import { PinLockProvider, usePinLock } from "./store/PinLockContext";
import PinLockScreen from "./components/PinLockScreen";
import Home from "./pages/Home";
import Statistics from "./pages/Statistics";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Purchases from "./pages/Purchases";
import Sales from "./pages/Sales";
import TransactionHistory from "./pages/TransactionHistory";
import Debts from "./pages/Debts";
import Suppliers from "./pages/Suppliers";
import Expenses from "./pages/Expenses";
import Calculator from "./pages/Calculator";
import Data from "./pages/Data";
import About from "./pages/About";
import Security from "./pages/Security";
import NotificationCenter from "./pages/NotificationCenter";

/**
 * Cổng khoá app: nếu PIN đang bật và chưa xác thực (mới mở app / vừa auto-lock),
 * chỉ render PinLockScreen - không mount AppDataProvider/Router bên dưới, đảm bảo
 * không có màn hình dữ liệu cửa hàng nào được truy cập khi chưa qua PIN.
 */
function AppGate() {
  const { ready, isLocked } = usePinLock();
  if (!ready) return null;
  if (isLocked) return <PinLockScreen />;

  return (
    <AppDataProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="sales" element={<Sales />} />
            <Route path="sales/history" element={<TransactionHistory />} />
            <Route path="debts" element={<Debts />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="calculator" element={<Calculator />} />
            <Route path="data" element={<Data />} />
            <Route path="about" element={<About />} />
            <Route path="security" element={<Security />} />
            <Route path="notifications" element={<NotificationCenter />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppDataProvider>
  );
}

function App() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: "#147f27",
          borderRadius: 10,
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
      }}
    >
      <PinLockProvider>
        <AppGate />
      </PinLockProvider>
    </ConfigProvider>
  );
}

export default App;
