import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  ClipboardList, 
  UserCheck, 
  CheckCircle,
  Facebook,
  Instagram,
  MessageCircle
} from 'lucide-react';

// Static landing page content
const landingContent = {
  hero: {
    title: "Dịch vụ dọn dẹp nhà cửa chuyên nghiệp",
    subtitle: "Đặt lịch nhanh chóng, nhân viên tận tâm, giá cả hợp lý",
    primaryButton: "Đặt dịch vụ ngay",
    secondaryButton: "Tìm hiểu thêm",
    ctaText: "Đặt dịch vụ ngay",
    imageUrl: "https://giupviecductam.vn/images/giupviecnha.jpg"
  },
  features: [
    {
      id: 1,
      title: "Đặt lịch dễ dàng",
      description: "Chỉ với vài cú click, bạn có thể đặt lịch dọn dẹp phù hợp với thời gian của mình",
      icon: "ClipboardList"
    },
    {
      id: 2,
      title: "Nhân viên chuyên nghiệp",
      description: "Đội ngũ nhân viên được đào tạo bài bản, có kinh nghiệm và tận tâm với công việc",
      icon: "UserCheck"
    },
    {
      id: 3,
      title: "Chất lượng đảm bảo",
      description: "Cam kết chất lượng dịch vụ, hoàn tiền 100% nếu không hài lòng",
      icon: "CheckCircle"
    }
  ],
  testimonials: [
    {
      id: 1,
      name: "Chị Lan Anh",
      location: "Hà Nội",
      rating: 5,
      comment: "Dịch vụ rất tốt, nhân viên chuyên nghiệp và tận tâm. Nhà tôi được dọn rất sạch sẽ.",
      avatar: "https://picsum.photos/200/200?random=1"
    },
    {
      id: 2,
      name: "Anh Minh Tuấn",
      location: "TP. Hồ Chí Minh",
      rating: 5,
      comment: "Giá cả hợp lý, đặt lịch dễ dàng. Tôi sẽ tiếp tục sử dụng dịch vụ này.",
      avatar: "https://picsum.photos/200/200?random=2"
    },
    {
      id: 3,
      name: "Chị Thu Hằng",
      location: "Đà Nẵng",
      rating: 5,
      comment: "Rất hài lòng với chất lượng dịch vụ. Nhân viên đến đúng giờ và làm việc rất cẩn thận.",
      avatar: "https://picsum.photos/200/200?random=3"
    }
  ],
  footer: {
    companyName: "HomeHelper",
    description: "Dịch vụ dọn dẹp nhà cửa chuyên nghiệp, đáng tin cậy",
    contact: {
      phone: "1900 xxxx",
      email: "info@homehelper.vn",
      address: "123 Đường ABC, Quận XYZ, TP. Hà Nội"
    },
    socialLinks: {
      facebook: "https://facebook.com/homehelper",
      instagram: "https://instagram.com/homehelper",
      zalo: "https://zalo.me/homehelper"
    }
  }
};

const LandingPage: React.FC = () => {
  const { hero, features, testimonials, footer } = landingContent;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">HomeHelper</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#services" className="text-gray-700 hover:text-blue-600">Dịch vụ</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600">Giới thiệu</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600">Đánh giá</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600">Liên hệ</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link
                to="/auth"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                {hero.title}
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                {hero.subtitle}
              </p>
              <Link
                to="/auth"
                className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                {hero.ctaText}
              </Link>
            </div>
            <div className="relative">
              <img
                src={hero.imageUrl}
                alt="Dịch vụ giúp việc"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Quy trình đơn giản 3 bước
            </h2>
            <p className="text-xl text-gray-600">
              Sử dụng dịch vụ của chúng tôi chỉ với 3 bước đơn giản
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const icons = {
                'ClipboardList': ClipboardList,
                'UserCheck': UserCheck,
                'CheckCircle': CheckCircle
              };
              const Icon = icons[feature.icon as keyof typeof icons];
              
              return (
                <div key={index} className="text-center p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Khách hàng nói gì về chúng tôi
            </h2>
            <p className="text-xl text-gray-600">
              Những đánh giá chân thực từ khách hàng đã sử dụng dịch vụ
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <div className="flex items-center">
                      {Array.from({ length: testimonial.rating }, (_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">HomeHelper</h3>
              <p className="text-gray-300 mb-4">
                Ứng dụng kết nối dịch vụ giúp việc gia đình uy tín và chuyên nghiệp
              </p>
              <div className="flex space-x-4">
                <Facebook className="w-6 h-6 text-gray-300 hover:text-white cursor-pointer" />
                <Instagram className="w-6 h-6 text-gray-300 hover:text-white cursor-pointer" />
                <MessageCircle className="w-6 h-6 text-gray-300 hover:text-white cursor-pointer" />
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Thông tin liên hệ</h4>
              <div className="space-y-2 text-gray-300">
                <p>{footer.contact.address}</p>
                <p>{footer.contact.phone}</p>
                <p>{footer.contact.email}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Liên kết</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-300 hover:text-white">Điều khoản dịch vụ</a>
                <a href="#" className="block text-gray-300 hover:text-white">Chính sách bảo mật</a>
                <a href="#" className="block text-gray-300 hover:text-white">Hỗ trợ khách hàng</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-300">
              © 2024 HomeHelper. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;