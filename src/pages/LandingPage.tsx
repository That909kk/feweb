import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  ClipboardList, 
  UserCheck, 
  CheckCircle,
  Facebook,
  Instagram,
  MessageCircle,
  Download,
  Smartphone,
  QrCode
} from 'lucide-react';

// Static landing page content
const landingContent = {
  hero: {
    title: "Dịch vụ giúp việc gia đình chuyên nghiệp",
    subtitle: "Home Mate - Đặt lịch nhanh chóng, nhân viên tận tâm, giá cả hợp lý",
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
    companyName: "Home Mate",
    description: "Dịch vụ giúp việc gia đình chuyên nghiệp, đáng tin cậy - Công ty TNHH Thành Thật",
    contact: {
      phone: "0825371577",
      email: "mthat456@gmail.com",
      address: "15 Nguyễn Đỗ Cung, Phường Tây Thạnh, TP. Hồ Chí Minh"
    },
    socialLinks: {
      facebook: "https://facebook.com/homemate",
      instagram: "https://instagram.com/homemate",
      zalo: "https://zalo.me/0342287853"
    }
  }
};

const LandingPage: React.FC = () => {
  const { hero, features, testimonials, footer } = landingContent;
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm fixed w-full top-0 z-50 border-b border-brand-outline/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-teal to-brand-navy flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-brand-teal to-brand-navy bg-clip-text text-transparent">Home Mate</h1>
            </div>
            <nav className="hidden md:flex space-x-6 lg:space-x-8">
              <a href="#services" className="text-brand-text/70 hover:text-brand-navy font-medium transition-colors">Dịch vụ</a>
              <a href="#about" className="text-brand-text/70 hover:text-brand-navy font-medium transition-colors">Giới thiệu</a>
              <a href="#testimonials" className="text-brand-text/70 hover:text-brand-navy font-medium transition-colors">Đánh giá</a>
              <a href="#contact" className="text-brand-text/70 hover:text-brand-navy font-medium transition-colors">Liên hệ</a>
            </nav>
            <div className="hidden sm:flex items-center space-x-3 lg:space-x-4">
              <Link
                to="/auth"
                className="text-brand-teal hover:text-brand-tealHover font-semibold transition-colors text-sm lg:text-base"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-brand-teal to-brand-navy text-white px-4 lg:px-5 py-2 rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 font-semibold text-sm lg:text-base"
              >
                Đăng ký
              </Link>
            </div>
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-xl text-brand-navy hover:bg-brand-teal/10 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Mở menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-brand-outline/20 py-4 space-y-3 animate-fade-in">
              <a href="#services" className="block text-brand-text/70 hover:text-brand-navy font-medium py-2 px-2 rounded-lg hover:bg-brand-teal/5 transition-colors" onClick={() => setMobileMenuOpen(false)}>Dịch vụ</a>
              <a href="#about" className="block text-brand-text/70 hover:text-brand-navy font-medium py-2 px-2 rounded-lg hover:bg-brand-teal/5 transition-colors" onClick={() => setMobileMenuOpen(false)}>Giới thiệu</a>
              <a href="#testimonials" className="block text-brand-text/70 hover:text-brand-navy font-medium py-2 px-2 rounded-lg hover:bg-brand-teal/5 transition-colors" onClick={() => setMobileMenuOpen(false)}>Đánh giá</a>
              <a href="#contact" className="block text-brand-text/70 hover:text-brand-navy font-medium py-2 px-2 rounded-lg hover:bg-brand-teal/5 transition-colors" onClick={() => setMobileMenuOpen(false)}>Liên hệ</a>
              <div className="flex flex-col gap-2 pt-3 border-t border-brand-outline/20">
                <Link
                  to="/auth"
                  className="text-center text-brand-teal hover:text-brand-tealHover font-semibold py-2 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="text-center bg-gradient-to-r from-brand-teal to-brand-navy text-white px-5 py-2.5 rounded-xl font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 bg-gradient-to-br from-blue-50 via-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-brand-teal/10 border border-brand-teal/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-teal fill-brand-teal" />
                <span className="text-xs sm:text-sm font-semibold text-brand-navy">Dịch vụ gia đình hàng đầu</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-brand-navy mb-4 sm:mb-6 leading-tight">
                {hero.title}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-brand-text/70 mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">
                {hero.subtitle}
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-teal to-brand-navy text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-semibold hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 shadow-lg w-full sm:w-auto"
              >
                {hero.ctaText}
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="relative order-first lg:order-last">
              <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-br from-brand-teal/20 to-brand-navy/20 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl"></div>
              <img
                src={hero.imageUrl}
                alt="Dịch vụ giúp việc"
                className="relative rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-brand-outline/40 w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Download App Section */}
      <section id="download" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-brand-navy via-brand-navy to-brand-teal relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-brand-teal rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-4 backdrop-blur-sm">
              <Smartphone className="w-4 h-4 text-brand-secondary" />
              <span className="text-sm font-semibold text-white">Tải ứng dụng miễn phí</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
              Tải App <span className="text-brand-secondary">Home Mate</span> ngay!
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto">
              Quét mã QR hoặc tải trực tiếp file APK để cài đặt ứng dụng trên điện thoại Android
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl border-4 border-brand-secondary/30 hover:scale-105 transition-transform duration-300">
                <img 
                  src="/QR-download-homemate-app.png" 
                  alt="QR Code tải app Home Mate" 
                  className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64"
                />
              </div>
              <div className="mt-4 flex items-center gap-2 text-white/90">
                <QrCode className="w-5 h-5 text-brand-secondary" />
                <span className="font-medium">Quét mã QR để tải App</span>
              </div>
            </div>
            
            {/* Divider */}
            <div className="hidden lg:flex flex-col items-center gap-4">
              <div className="h-24 w-px bg-white/30"></div>
              <span className="text-white/60 font-medium text-sm">HOẶC</span>
              <div className="h-24 w-px bg-white/30"></div>
            </div>
            <div className="lg:hidden flex items-center gap-4 w-full max-w-xs">
              <div className="flex-1 h-px bg-white/30"></div>
              <span className="text-white/60 font-medium text-sm">HOẶC</span>
              <div className="flex-1 h-px bg-white/30"></div>
            </div>
            
            {/* Download APK Button */}
            <div className="flex flex-col items-center">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center hover:bg-white/15 transition-colors">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-brand-secondary to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Download className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Tải file APK</h3>
                <p className="text-white/70 mb-6 text-sm sm:text-base">Dành cho Android 7.0+</p>
                <a 
                  href="/homemate.apk" 
                  download="homemate.apk"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-brand-secondary to-yellow-500 text-brand-navy px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 shadow-lg"
                >
                  <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                  Tải xuống APK
                </a>
                <p className="text-white/50 text-xs sm:text-sm mt-4">homemate.apk • ~100MB</p>
              </div>
            </div>
          </div>
          
          {/* Installation Guide */}
          <div className="mt-10 sm:mt-12 text-center">
            <div className="inline-flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-white/70 text-xs sm:text-sm">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <span className="w-5 h-5 bg-brand-secondary text-brand-navy rounded-full flex items-center justify-center text-xs font-bold">1</span>
                Tải file APK
              </span>
              <span className="text-white/40">→</span>
              
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <span className="w-5 h-5 bg-brand-secondary text-brand-navy rounded-full flex items-center justify-center text-xs font-bold">2</span>
                Cài đặt & Sử dụng
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-brand-teal/10 border border-brand-teal/20 rounded-full px-4 py-2 mb-4">
              <span className="text-sm font-semibold text-brand-navy">Quy trình đơn giản</span>
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-navy mb-4">
              Quy trình đơn giản 3 bước
            </h2>
            <p className="text-xl text-brand-text/70">
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
                <div key={index} className="text-center p-6 rounded-3xl border border-brand-outline/40 bg-white hover:-translate-y-1 hover:shadow-elevation-sm transition-all duration-300 group">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-teal/20 to-brand-navy/20 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-brand-teal" />
                  </div>
                  <h3 className="text-xl font-semibold text-brand-navy mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-brand-text/70">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-blue-50/50 via-green-50/50 to-blue-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-brand-teal/10 border border-brand-teal/20 rounded-full px-4 py-2 mb-4">
              <span className="text-sm font-semibold text-brand-navy">Phản hồi từ khách hàng</span>
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-navy mb-4">
              Khách hàng nói gì về chúng tôi
            </h2>
            <p className="text-xl text-brand-text/70">
              Những đánh giá chân thực từ khách hàng đã sử dụng dịch vụ
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/95 backdrop-blur-sm p-6 rounded-3xl border border-brand-outline/40 shadow-sm hover:-translate-y-1 hover:shadow-elevation-sm transition-all duration-300">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-2xl mr-4 border-2 border-brand-outline/40"
                  />
                  <div>
                    <h4 className="font-semibold text-brand-navy">{testimonial.name}</h4>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: testimonial.rating }, (_, i) => (
                        <Star key={i} className="w-4 h-4 text-brand-secondary fill-brand-secondary" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-brand-text/70 italic leading-relaxed">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-brand-navy text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold">Home Mate</h3>
              </div>
              <p className="text-white/70 mb-2">
                Ứng dụng kết nối dịch vụ giúp việc gia đình uy tín và chuyên nghiệp
              </p>
              <p className="text-white/50 text-sm mb-4">
                Công ty TNHH Thành Thật
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors">
                  <Facebook className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors">
                  <Instagram className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Thông tin liên hệ</h4>
              <div className="space-y-2 text-white/70">
                <p className="flex items-start gap-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{footer.contact.address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{footer.contact.phone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{footer.contact.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 flex-shrink-0" />
                  <span>Zalo: 0342287853</span>
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Liên kết</h4>
              <div className="space-y-2">
                <a href="#" className="block text-white/70 hover:text-white transition-colors">Điều khoản dịch vụ</a>
                <a href="#" className="block text-white/70 hover:text-white transition-colors">Chính sách bảo mật</a>
                <a href="#" className="block text-white/70 hover:text-white transition-colors">Hỗ trợ khách hàng</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-white/70">
              © 2025 Home Mate - Công ty TNHH Thành Thật. Tất cả quyền được bảo lưu.
            </p>
            <p className="text-white/50 text-sm mt-2">
              Homemate 1.0.2 Phát triển bởi Lê Minh Thật (That909kk) 
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;