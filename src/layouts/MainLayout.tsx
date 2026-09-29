import React, { useState } from "react";
import { Layout, Menu, Grid, Dropdown, Modal, Button, message } from "antd";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { ReloadOutlined, ClearOutlined, ArrowLeftOutlined, MoreOutlined } from "@ant-design/icons";
import { useAppData } from "../store/AppDataContext";
import {
  menuItems,
  pageTitles,
  subPageTitles,
  mobilePrimaryItems,
  mobileMoreItems,
} from "./menuItems";
import MobileBottomNav from "./MobileBottomNav";
import logo from "../assets/logo.png";

const { Sider, Header, Content } = Layout;
const { useBreakpoint } = Grid;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { resetToSampleData, resetAllData } = useAppData();

  const isPrimaryRoute = menuItems.some((m) => m.key === location.pathname);
  const selectedKey = isPrimaryRoute ? location.pathname : "/sales";
  const title = pageTitles[location.pathname] ?? subPageTitles[location.pathname] ?? "";
  // Trang chủ ("/") có header riêng (logo, lời chào, nút cài đặt) theo hình mẫu, nên trên mobile
  // ẩn luôn thanh tiêu đề mặc định để khỏi bị lặp 2 header chồng nhau.
  const hideDefaultHeader = isMobile && location.pathname === "/";

  const doResetSample = () => {
    resetToSampleData();
    message.success("Đã đặt lại dữ liệu mẫu");
  };

  const doResetAll = () => {
    resetAllData();
    message.success("Đã xóa trắng toàn bộ dữ liệu");
  };

  const confirmResetSample = () => {
    Modal.confirm({
      title: "Đặt lại dữ liệu mẫu?",
      content:
        "Toàn bộ sản phẩm, đơn bán, phiếu nhập, công nợ đã lưu sẽ bị xóa và thay bằng dữ liệu mẫu ban đầu. Không thể hoàn tác.",
      okText: "Đặt lại",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: doResetSample,
    });
  };

  const confirmResetAll = () => {
    Modal.confirm({
      title: "Đặt lại toàn bộ - Xóa trắng dữ liệu?",
      content:
        "Toàn bộ sản phẩm, danh mục, đơn bán, phiếu nhập, công nợ sẽ bị XÓA HẾT. Dùng khi bạn muốn bắt đầu nhập dữ liệu thật từ đầu. Không thể hoàn tác.",
      okText: "Xóa hết",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: doResetAll,
    });
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          breakpoint="md"
          style={{ background: "#fff", borderRight: "1px solid #f0f0f0" }}
        >
          <div
            style={{
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              paddingLeft: collapsed ? 0 : 20,
              fontWeight: 700,
              fontSize: 16,
              color: "#147f27",
              gap: 8,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            <img src={logo} alt="Tạp Hóa Mini" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} />
            {!collapsed && <span>Tạp Hóa Mini</span>}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={({ key }) => navigate(key)}
            style={{ borderRight: 0 }}
          >
            {menuItems.map((item) => (
              <Menu.Item key={item.key} icon={item.icon}>
                {item.label}
              </Menu.Item>
            ))}
          </Menu>
        </Sider>
      )}
      <Layout>
        {!hideDefaultHeader && (
        <Header
          style={{
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 17,
            fontWeight: 600,
            color: "#1f2933",
            height: isMobile ? 52 : 64,
            lineHeight: isMobile ? "52px" : "64px",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!isPrimaryRoute ? (
              <ArrowLeftOutlined
                onClick={() => navigate(-1)}
                style={{ fontSize: 18, cursor: "pointer" }}
              />
            ) : (
              isMobile && (
                <img src={logo} alt="Tạp Hóa Mini" style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }} />
              )
            )}
            {title}
          </span>

          {/* Trên mobile, các hành động phụ nằm trong bottom sheet "Thêm" */}
          {!isMobile && (
            <Dropdown
              menu={{
                items: [
                  { key: "sample", icon: <ReloadOutlined />, label: "Đặt lại dữ liệu mẫu", onClick: confirmResetSample },
                  { key: "all", icon: <ClearOutlined />, danger: true, label: "Đặt lại toàn bộ (xóa hết)", onClick: confirmResetAll },
                ],
              }}
              placement="bottomRight"
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          )}
        </Header>
        )}
        <Content
          style={{
            margin: isMobile ? "12px 12px 0" : 16,
            marginBottom: isMobile ? 76 : 16,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
      {isMobile && (
        <MobileBottomNav
          primaryItems={mobilePrimaryItems}
          moreItems={mobileMoreItems}
          onResetSampleData={doResetSample}
          onResetAllData={doResetAll}
        />
      )}
    </Layout>
  );
};

export default MainLayout;
