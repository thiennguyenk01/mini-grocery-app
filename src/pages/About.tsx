import React from "react";
import { Card, Button, Space } from "antd";
import { PhoneOutlined, MessageOutlined, HeartFilled } from "@ant-design/icons";
import logo from "../assets/logo.png";
import vietqr from "../assets/vietqr.png";

const PHONE = "0868670553";
const AUTHOR = "Nguyễn Hạo Thiên";

const About: React.FC = () => {
  return (
    <div style={{ maxWidth: 440, margin: "0 auto" }}>
      <Card className="page-card" style={{ textAlign: "center", marginBottom: 16 }}>
        <img
          src={logo}
          alt="Logo cửa hàng"
          style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", marginBottom: 12 }}
        />
        <h3 style={{ margin: 0 }}>Tạp Hóa Nga Cư</h3>
        <p style={{ color: "#888", marginTop: 4 }}>Ứng dụng quản lý bán hàng tạp hóa</p>

        <div style={{ borderTop: "1px solid #f0f0f0", margin: "16px 0", paddingTop: 16 }}>
          <p style={{ marginBottom: 4, color: "#888" }}>Được phát triển bởi</p>
          <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{AUTHOR}</p>
          <p style={{ color: "#888", marginTop: 4 }}>SĐT / Zalo: {PHONE}</p>
        </div>

        <Space wrap style={{ justifyContent: "center", width: "100%" }}>
          <Button icon={<PhoneOutlined />} href={`tel:${PHONE}`}>
            Gọi điện
          </Button>
          <Button
            type="primary"
            icon={<MessageOutlined />}
            href={`https://zalo.me/${PHONE}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Nhắn Zalo
          </Button>
        </Space>
      </Card>

      <Card
        className="page-card"
        style={{ textAlign: "center" }}
        title={
          <span>
            <HeartFilled style={{ color: "#ef4444", marginRight: 8 }} />
            Ủng hộ tác giả
          </span>
        }
      >
        <p style={{ color: "#666" }}>
          Nếu thấy app hữu ích cho việc buôn bán, mời tác giả một ly cà phê nhé ☕
        </p>
        <img
          src={vietqr}
          alt="Mã QR donate"
          style={{ width: 220, maxWidth: "100%", borderRadius: 16, margin: "8px 0" }}
        />
        <p style={{ color: "#aaa", fontSize: 13 }}>Quét mã bằng app ngân hàng bất kỳ (VietQR)</p>
      </Card>
    </div>
  );
};

export default About;
