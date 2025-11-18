import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  CreditCard,
  CheckCircle,
  Navigation as NavigationIcon,
  User,
  AlertTriangle,
  X
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useServices, useServiceOptions, useServicePriceCalculation, useSuitableEmployees } from '../../hooks/useServices';
import { useBooking } from '../../hooks/useBooking';
import { useAuth } from '../../contexts/AuthContext';
import { useCategories } from '../../hooks/useCategories';
import { useAddress } from '../../hooks/useAddress';
import DashboardLayout from '../../layouts/DashboardLayout';
import MultipleImageUpload from '../../components/MultipleImageUpload';
import type { 
  SuitableEmployee,
  PaymentMethod
} from '../../types/api';

// Helper function for input validation
const validateBookingForm = (
  formData: {
    serviceId: string;
    address: string;
    bookingTimes: string[];
    duration: number | null;
  }
): string[] => {
  const errors: string[] = [];
  
  if (!formData.serviceId) errors.push('Vui lòng chọn dịch vụ');
  if (!formData.address) errors.push('Vui lòng nhập địa chỉ');
  if (!formData.bookingTimes || formData.bookingTimes.length === 0) errors.push('Vui lòng thêm ít nhất một mốc thời gian');
  if (!formData.duration || formData.duration <= 0) errors.push('Vui lòng chọn thời lượng dự kiến');
  
  // Validate each booking time
  if (formData.bookingTimes && formData.bookingTimes.length > 0) {
    formData.bookingTimes.forEach((timeStr, index) => {
      const dateTime = new Date(timeStr);
      const now = new Date();
      now.setHours(now.getHours() + 1); // Booking should be at least 1 hour in the future
      
      if (dateTime <= now) {
        errors.push(`Mốc thời gian ${index + 1} phải cách hiện tại ít nhất 1 giờ`);
      }
      
      // Validate business hours (8:00-17:00)
      const hours = dateTime.getHours();
      if (hours < 8 || hours >= 17) {
        errors.push(`Mốc thời gian ${index + 1} phải nằm trong giờ làm việc (8:00 - 17:00)`);
      }
    });
  }
  
  return errors;
};

const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { services } = useServices();
  const { 
    categories, 
    selectCategory, 
    resetCategoryFilter, 
    categoryWithServices, 
    isLoading: categoriesLoading 
  } = useCategories();
  const { user } = useAuth();
  
  // New hooks for enhanced booking flow
  const { serviceOptions, loadServiceOptions, clearServiceOptions } = useServiceOptions();
  const { priceData, calculateServicePrice, clearPriceData } = useServicePriceCalculation();
  const { employeesData, loadSuitableEmployees } = useSuitableEmployees();
  const { 
    createBooking,
    getDefaultAddress, 
    getPaymentMethods, 
    isLoading: bookingLoading, 
    error: bookingError 
  } = useBooking();
  const preselectedServiceId = searchParams.get('service');
  
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    serviceId: preselectedServiceId || '',
    address: '',
    bookingTimes: [] as string[], // Mảng các mốc thời gian ISO 8601
    duration: null as number | null,
    notes: '',
    paymentMethod: '1', // Default to first payment method ID
    promoCode: ''
  });
  
  // State cho việc thêm thời gian mới (tạm thời)
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('');
  
  // State cho chọn nhanh theo tuần
  const [weekStartDate, setWeekStartDate] = useState('');
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]); // 0 = CN, 1 = T2, ..., 6 = T7
  const [weekTime, setWeekTime] = useState('09:00');
  const [timeSelectionMode, setTimeSelectionMode] = useState<'single' | 'week' | 'monthly'>('single'); // Tab selector
  
  // State cho đặt định kỳ theo tháng
  const [monthlyStartDate, setMonthlyStartDate] = useState('');
  const [monthlyEndDate, setMonthlyEndDate] = useState('');
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([]); // 1-31: ngày trong tháng
  const [monthlyTime, setMonthlyTime] = useState('09:00');
  const [monthlyRecurringType, setMonthlyRecurringType] = useState<'dates' | 'weekday'>('dates'); // Chọn theo ngày cụ thể hoặc thứ trong tháng
  const [selectedMonthWeekday, setSelectedMonthWeekday] = useState<number>(1); // 1-7: T2-CN
  const [selectedWeekOfMonth, setSelectedWeekOfMonth] = useState<number>(1); // 1-5: tuần 1-5
  
  // Category selection state
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loadingCategoryServices, setLoadingCategoryServices] = useState<boolean>(false);
  
  // Error display state
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  
  const [addressSource, setAddressSource] = useState<'profile' | 'current' | 'custom'>('profile');
  const [customAddress, setCustomAddress] = useState('');
  const [currentLocationAddress, setCurrentLocationAddress] = useState('');
  
  // State cho bản đồ
  const [mapCoordinates, setMapCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  // State cho payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // State for booking flow
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<number[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showEmployeeSelection, setShowEmployeeSelection] = useState<boolean>(false);
  const [employeeSelectionErrors, setEmployeeSelectionErrors] = useState<string[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [showPromoCodeInput, setShowPromoCodeInput] = useState<boolean>(false);
  const [durationInputType, setDurationInputType] = useState<'preset' | 'custom'>('preset');
  const [customDuration, setCustomDuration] = useState<string>('');
  
  // State for booking post (when no employee selected)
  const [postTitle, setPostTitle] = useState<string>('');
  const [postImageFiles, setPostImageFiles] = useState<File[]>([]); // Lưu nhiều File objects
  
  // State cho địa chỉ 2 cấp mới
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('');
  const [selectedProvinceName, setSelectedProvinceName] = useState<string>('');
  const [selectedCommuneCode, setSelectedCommuneCode] = useState<string>('');
  const [selectedCommuneName, setSelectedCommuneName] = useState<string>('');
  const [streetAddress, setStreetAddress] = useState<string>(''); // Số nhà, tên đường
  const [manualAddress, setManualAddress] = useState<string>(''); // Địa chỉ nhập tay
  const [isManualAddress, setIsManualAddress] = useState<boolean>(false);
  
  // State cho thông tin địa chỉ mặc định từ API
  const [defaultAddressInfo, setDefaultAddressInfo] = useState<{
    addressId: string;
    ward: string;
    city: string;
    latitude?: number;
    longitude?: number;
  } | null>(null);
  
  // Hook cho địa chỉ
  const { 
    provinces, 
    communes, 
    isLoadingProvinces, 
    isLoadingCommunes, 
    loadCommunes, 
    resetCommunes,
    getFullAddress 
  } = useAddress();

  // Load payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const methods = await getPaymentMethods();
        if (methods) {
          setPaymentMethods(methods);
          // Set default payment method to the first one (usually CASH)
          if (methods.length > 0 && bookingData.paymentMethod === '1') {
            setBookingData(prev => ({
              ...prev,
              paymentMethod: methods[0].methodId.toString()
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load payment methods:', error);
      }
    };

    loadPaymentMethods();
  }, []); // Only run once on mount
  
  // Hàm thêm mốc thời gian mới vào danh sách
  const handleAddBookingTime = () => {
    if (!tempDate || !tempTime) {
      setErrorMessages(['Vui lòng chọn đầy đủ ngày và giờ']);
      return;
    }
    
    // Tạo datetime string ISO 8601
    const dateTimeString = `${tempDate}T${tempTime}:00`;
    const dateTime = new Date(dateTimeString);
    
    // Kiểm tra thời gian phải ở tương lai
    const now = new Date();
    if (dateTime <= now) {
      setErrorMessages(['Thời gian đặt lịch phải ở tương lai']);
      return;
    }
    
    // Kiểm tra trùng lặp
    if (bookingData.bookingTimes.includes(dateTimeString)) {
      setErrorMessages(['Mốc thời gian này đã được thêm']);
      return;
    }
    
    // Thêm vào danh sách
    setBookingData(prev => ({
      ...prev,
      bookingTimes: [...prev.bookingTimes, dateTimeString].sort()
    }));
    
    // Reset form tạm thời
    setTempDate('');
    setTempTime('');
    setErrorMessages([]);
  };
  
  // Hàm xóa mốc thời gian khỏi danh sách
  const handleRemoveBookingTime = (timeToRemove: string) => {
    setBookingData(prev => ({
      ...prev,
      bookingTimes: prev.bookingTimes.filter(t => t !== timeToRemove)
    }));
  };
  
  // Hàm format hiển thị thời gian
  const formatBookingTime = (isoString: string): string => {
    const date = new Date(isoString);
    const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${dayOfWeek}, ${day}/${month}/${year} - ${hours}:${minutes}`;
  };
  
  // Hàm toggle chọn ngày trong tuần
  const handleToggleWeekDay = (dayIndex: number) => {
    setSelectedWeekDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };
  
  // Hàm thêm các ngày trong tuần đã chọn
  const handleAddWeekDays = () => {
    if (!weekStartDate) {
      setErrorMessages(['Vui lòng chọn ngày bắt đầu tuần']);
      return;
    }
    
    if (selectedWeekDays.length === 0) {
      setErrorMessages(['Vui lòng chọn ít nhất một ngày trong tuần']);
      return;
    }
    
    const startDate = new Date(weekStartDate);
    const newTimes: string[] = [];
    const errors: string[] = [];
    const now = new Date();
    
    // Tính ngày đầu tuần (Chủ nhật)
    const dayOfWeek = startDate.getDay();
    const firstDayOfWeek = new Date(startDate);
    firstDayOfWeek.setDate(startDate.getDate() - dayOfWeek);
    
    selectedWeekDays.forEach(dayIndex => {
      const targetDate = new Date(firstDayOfWeek);
      targetDate.setDate(firstDayOfWeek.getDate() + dayIndex);
      
      const dateTimeString = `${targetDate.toISOString().split('T')[0]}T${weekTime}:00`;
      const dateTime = new Date(dateTimeString);
      
      // Kiểm tra thời gian phải ở tương lai
      if (dateTime <= now) {
        errors.push(`${formatBookingTime(dateTimeString)} đã qua`);
        return;
      }
      
      // Kiểm tra trùng lặp
      if (!bookingData.bookingTimes.includes(dateTimeString)) {
        newTimes.push(dateTimeString);
      }
    });
    
    if (newTimes.length > 0) {
      setBookingData(prev => ({
        ...prev,
        bookingTimes: [...prev.bookingTimes, ...newTimes].sort()
      }));
      
      // Reset form
      setSelectedWeekDays([]);
      setWeekStartDate('');
      setErrorMessages([]);
    }
    
    if (errors.length > 0) {
      setErrorMessages(errors);
    }
  };
  
  // Hàm sao chép mốc thời gian sang ngày khác
  const handleDuplicateTime = (originalTime: string, daysToAdd: number) => {
    const originalDate = new Date(originalTime);
    const newDate = new Date(originalDate);
    newDate.setDate(originalDate.getDate() + daysToAdd);
    
    const newTimeString = newDate.toISOString().slice(0, 19);
    const now = new Date();
    
    if (newDate <= now) {
      setErrorMessages(['Thời gian sao chép phải ở tương lai']);
      return;
    }
    
    if (bookingData.bookingTimes.includes(newTimeString)) {
      setErrorMessages(['Mốc thời gian này đã tồn tại']);
      return;
    }
    
    setBookingData(prev => ({
      ...prev,
      bookingTimes: [...prev.bookingTimes, newTimeString].sort()
    }));
    
    setErrorMessages([]);
  };
  
  // Hàm toggle chọn ngày trong tháng
  const handleToggleMonthDay = (day: number) => {
    setSelectedMonthDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };
  
  // Hàm thêm các ngày định kỳ theo tháng
  const handleAddMonthlyRecurring = () => {
    if (!monthlyStartDate) {
      setErrorMessages(['Vui lòng chọn ngày bắt đầu']);
      return;
    }
    
    if (!monthlyEndDate) {
      setErrorMessages(['Vui lòng chọn ngày kết thúc']);
      return;
    }
    
    const startDate = new Date(monthlyStartDate);
    const endDate = new Date(monthlyEndDate);
    
    if (endDate < startDate) {
      setErrorMessages(['Ngày kết thúc phải sau ngày bắt đầu']);
      return;
    }
    
    if (monthlyRecurringType === 'dates' && selectedMonthDays.length === 0) {
      setErrorMessages(['Vui lòng chọn ít nhất một ngày trong tháng']);
      return;
    }
    
    const newTimes: string[] = [];
    const errors: string[] = [];
    const now = new Date();
    
    // Tính toán các tháng trong khoảng thời gian
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      if (monthlyRecurringType === 'dates') {
        // Chọn theo ngày cụ thể trong tháng (ví dụ: ngày 1, 15, 30)
        selectedMonthDays.forEach(day => {
          const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          
          // Kiểm tra ngày có hợp lệ không (ví dụ: tháng 2 không có ngày 30)
          if (targetDate.getMonth() === currentDate.getMonth() && targetDate >= startDate && targetDate <= endDate) {
            const dateTimeString = `${targetDate.toISOString().split('T')[0]}T${monthlyTime}:00`;
            const dateTime = new Date(dateTimeString);
            
            if (dateTime > now && !bookingData.bookingTimes.includes(dateTimeString)) {
              newTimes.push(dateTimeString);
            } else if (dateTime <= now) {
              errors.push(`${formatBookingTime(dateTimeString)} đã qua`);
            }
          }
        });
      } else {
        // Chọn theo thứ trong tháng (ví dụ: Thứ 2 tuần đầu tiên, Thứ 6 cuối tháng)
        const targetDate = getNthWeekdayOfMonth(
          currentDate.getFullYear(), 
          currentDate.getMonth(), 
          selectedMonthWeekday, 
          selectedWeekOfMonth
        );
        
        if (targetDate && targetDate >= startDate && targetDate <= endDate) {
          const dateTimeString = `${targetDate.toISOString().split('T')[0]}T${monthlyTime}:00`;
          const dateTime = new Date(dateTimeString);
          
          if (dateTime > now && !bookingData.bookingTimes.includes(dateTimeString)) {
            newTimes.push(dateTimeString);
          } else if (dateTime <= now) {
            errors.push(`${formatBookingTime(dateTimeString)} đã qua`);
          }
        }
      }
      
      // Chuyển sang tháng tiếp theo
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    if (newTimes.length > 0) {
      setBookingData(prev => ({
        ...prev,
        bookingTimes: [...prev.bookingTimes, ...newTimes].sort()
      }));
      
      setErrorMessages([]);
    } else if (errors.length === 0) {
      setErrorMessages(['Không tìm thấy mốc thời gian hợp lệ nào']);
    }
    
    if (errors.length > 0) {
      setErrorMessages(errors);
    }
  };
  
  // Hàm helper: Tìm ngày thứ N trong tháng (ví dụ: Thứ 2 đầu tiên, Thứ 6 cuối cùng)
  const getNthWeekdayOfMonth = (year: number, month: number, weekday: number, weekNumber: number): Date | null => {
    // weekday: 0=CN, 1=T2, ..., 6=T7
    // weekNumber: 1=tuần đầu, 2=tuần 2, ..., 5=tuần cuối
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    if (weekNumber === 5) {
      // Tìm ngày cuối cùng của weekday trong tháng
      let targetDate = new Date(lastDay);
      while (targetDate.getDay() !== weekday) {
        targetDate.setDate(targetDate.getDate() - 1);
      }
      return targetDate;
    } else {
      // Tìm ngày thứ N của weekday trong tháng
      let targetDate = new Date(firstDay);
      let count = 0;
      
      while (targetDate.getMonth() === month) {
        if (targetDate.getDay() === weekday) {
          count++;
          if (count === weekNumber) {
            return targetDate;
          }
        }
        targetDate.setDate(targetDate.getDate() + 1);
      }
      
      return null; // Không tìm thấy (ví dụ: tháng không có Thứ 2 thứ 5)
    }
  };
  
  // Tự động set ngày và tuần hiện tại khi component mount
  useEffect(() => {
    const now = new Date();
    
    // Set ngày hiện tại cho tempDate
    const today = now.toISOString().split('T')[0];
    setTempDate(today);
    
    // Set tuần hiện tại cho weekStartDate
    setWeekStartDate(today);
    
    // Set giờ mặc định (9:00 AM)
    const currentHour = now.getHours();
    if (currentHour < 17) {
      // Nếu còn trong giờ làm việc, set giờ tiếp theo
      const nextHour = Math.max(currentHour + 1, 9);
      setTempTime(`${nextHour.toString().padStart(2, '0')}:00`);
      setWeekTime(`${nextHour.toString().padStart(2, '0')}:00`);
      setMonthlyTime(`${nextHour.toString().padStart(2, '0')}:00`);
    } else {
      // Nếu đã hết giờ làm việc, set 9:00 AM
      setTempTime('09:00');
      setWeekTime('09:00');
      setMonthlyTime('09:00');
    }
    
    // Set khoảng thời gian mặc định cho monthly (tháng này + 2 tháng tiếp theo)
    setMonthlyStartDate(today);
    const threeMonthsLater = new Date(now);
    threeMonthsLater.setMonth(now.getMonth() + 3);
    setMonthlyEndDate(threeMonthsLater.toISOString().split('T')[0]);
  }, []);
  
  // Lấy địa chỉ từ profile người dùng khi component mount
  useEffect(() => {
    if (user?.profileData && 'address' in user.profileData && user.profileData.address) {
      setBookingData(prev => ({
        ...prev,
        address: (user.profileData as any).address
      }));
    }
  }, [user]);

  // Load default address info khi component mount nếu addressSource là 'profile'
  useEffect(() => {
    const loadDefaultAddressInfo = async () => {
      if (addressSource === 'profile' && user?.customerId && !defaultAddressInfo) {
        try {
          console.log('🏠 [INIT] Loading default address info on mount');
          const defaultAddress = await getDefaultAddress(user.customerId);
          
          if (defaultAddress && defaultAddress.addressId) {
            console.log('🏠 [INIT] Got default address:', defaultAddress);
            
            // Lưu tất cả thông tin cần thiết từ default address
            setDefaultAddressInfo({
              addressId: defaultAddress.addressId,
              ward: defaultAddress.ward || '',
              city: defaultAddress.city || '',
              latitude: defaultAddress.latitude,
              longitude: defaultAddress.longitude
            });
            
            // Cập nhật coordinates nếu có
            if (defaultAddress.latitude && defaultAddress.longitude) {
              setMapCoordinates({
                lat: defaultAddress.latitude,
                lng: defaultAddress.longitude
              });
            }
          }
        } catch (error) {
          console.error('🏠 [INIT ERROR] Failed to load default address:', error);
        }
      }
    };
    
    loadDefaultAddressInfo();
  }, [addressSource, user?.customerId, getDefaultAddress, defaultAddressInfo]);

  // Auto calculate price when service or options change
  useEffect(() => {
    if (bookingData.serviceId && selectedChoiceIds.length >= 0) {
      handlePriceCalculation();
    }
  }, [bookingData.serviceId, selectedChoiceIds]);

  // Khởi tạo và cập nhật bản đồ khi có tọa độ và step là 2 (trang địa điểm)
  useEffect(() => {
    if (mapCoordinates && mapContainerRef.current && step === 2) {
      // Nếu chưa có instance map, tạo mới
      if (!mapInstanceRef.current) {
        console.log("Creating new map instance");
        const map = L.map(mapContainerRef.current).setView([mapCoordinates.lat, mapCoordinates.lng], 16);
        
        // Thêm layer bản đồ
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Thêm marker
        const marker = L.marker([mapCoordinates.lat, mapCoordinates.lng]).addTo(map);
        marker.bindPopup("Vị trí của bạn").openPopup();
        
        // Thêm event listener cho click trên map (chỉ khi đang ở chế độ current location)
        map.on('click', async (e) => {
          if (addressSource === 'current') {
            const { lat, lng } = e.latlng;
            console.log("Map clicked at:", lat, lng);
            
            // Cập nhật tọa độ
            setMapCoordinates({ lat, lng });
            
            // Di chuyển marker đến vị trí click
            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
              markerRef.current.bindPopup("Vị trí đã chọn").openPopup();
            }
            
            // Lấy địa chỉ từ coordinates mới
            const newAddress = await getAddressFromCoordinates(lat, lng);
            if (newAddress) {
              setCurrentLocationAddress(newAddress);
              setBookingData(prev => ({ ...prev, address: newAddress }));
            }
          }
        });
        
        // Lưu reference
        mapInstanceRef.current = map;
        markerRef.current = marker;
      } else {
        // Nếu đã có map, chỉ cập nhật view và marker
        console.log("Updating existing map view");
        mapInstanceRef.current.setView([mapCoordinates.lat, mapCoordinates.lng], 16);
        
        if (markerRef.current) {
          markerRef.current.setLatLng([mapCoordinates.lat, mapCoordinates.lng]);
        }
      }
    }
    
    // Cleanup khi unmount
    return () => {
      if (mapInstanceRef.current && step !== 2) {
        console.log("Cleaning up map on step change");
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [mapCoordinates, step]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  // Hàm lấy vị trí hiện tại với độ chính xác cao
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.error('Trình duyệt không hỗ trợ định vị');
      return;
    }

    setIsLoadingLocation(true);
    console.log("Getting current location with high accuracy...");

    // Cấu hình options cho độ chính xác cao
    const geoOptions = {
      enableHighAccuracy: true,      // Bật độ chính xác cao (sử dụng GPS nếu có)
      timeout: 15000,               // Timeout 15 giây
      maximumAge: 30000            // Cache vị trí trong 30 giây
    };

    let bestPosition: GeolocationPosition | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    const tryGetPosition = () => {
      attempts++;
      console.log(`Attempt ${attempts}/${maxAttempts} to get location`);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(`Received coordinates: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
          
          // Kiểm tra độ chính xác
          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
            console.log(`New best position with accuracy: ${accuracy}m`);
          }

          // Nếu độ chính xác đã đủ tốt (< 50m) hoặc đã hết số lần thử, sử dụng kết quả tốt nhất
          if (accuracy < 50 || attempts >= maxAttempts) {
            console.log(`Using position with accuracy: ${bestPosition.coords.accuracy}m`);
            
            // Lưu tọa độ cho bản đồ
            setMapCoordinates({ 
              lat: bestPosition.coords.latitude, 
              lng: bestPosition.coords.longitude 
            });
            
            // Lấy địa chỉ từ coordinates
            const formattedAddress = await getAddressFromCoordinates(
              bestPosition.coords.latitude, 
              bestPosition.coords.longitude
            );
            
            if (formattedAddress) {
              setCurrentLocationAddress(formattedAddress);
              setBookingData(prev => ({ ...prev, address: formattedAddress }));
              setAddressSource('current');
            }
            
            setIsLoadingLocation(false);
          } else if (attempts < maxAttempts) {
            // Thử lại nếu độ chính xác chưa đủ tốt
            setTimeout(tryGetPosition, 2000);
          }
        },
        (error) => {
          console.error(`Geolocation error (attempt ${attempts}):`, error.message);
          
          // Xử lý các loại lỗi cụ thể
          let errorMessage = 'Không thể xác định vị trí hiện tại';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Thông tin vị trí không khả dụng. Vui lòng kiểm tra kết nối mạng và GPS.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Quá thời gian chờ xác định vị trí. Vui lòng thử lại.';
              break;
          }
          
          // Nếu có vị trí tốt nhất từ lần thử trước, sử dụng nó
          if (bestPosition && attempts >= maxAttempts) {
            console.log(`Using best available position with accuracy: ${bestPosition.coords.accuracy}m`);
            setMapCoordinates({ 
              lat: bestPosition.coords.latitude, 
              lng: bestPosition.coords.longitude 
            });
            
            getAddressFromCoordinates(bestPosition.coords.latitude, bestPosition.coords.longitude)
              .then(formattedAddress => {
                if (formattedAddress && bestPosition) {
                  setCurrentLocationAddress(formattedAddress);
                  setBookingData(prev => ({ ...prev, address: formattedAddress }));
                  setAddressSource('current');
                }
              });
          } else if (attempts < maxAttempts) {
            // Thử lại với cấu hình ít nghiêm ngặt hơn
            setTimeout(() => {
              const fallbackOptions = {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 60000
              };
              
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  console.log(`Fallback position: ${position.coords.latitude}, ${position.coords.longitude} (accuracy: ${position.coords.accuracy}m)`);
                  bestPosition = position;
                  tryGetPosition();
                },
                () => {
                  attempts = maxAttempts; // Dừng thử
                  tryGetPosition();
                },
                fallbackOptions
              );
            }, 1000);
          }
          
          if (attempts >= maxAttempts && !bestPosition) {
            setIsLoadingLocation(false);
            alert(errorMessage);
          }
        },
        geoOptions
      );
    };

    tryGetPosition();
  };

  // Hàm lấy địa chỉ từ coordinates (reverse geocoding) với nhiều nguồn
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      setIsLoadingLocation(true);
      
      // Thử nhiều service geocoding để có kết quả tốt nhất
      const geocodingServices = [
        // Service 1: Nominatim với cấu hình tối ưu cho Việt Nam
        {
          name: 'Nominatim',
          url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=vi,en&countrycodes=vn`
        },
        // Service 2: Photon (alternative)
        {
          name: 'Photon',
          url: `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=vi`
        }
      ];

      let bestResult = null;
      
      // Thử từng service
      for (const service of geocodingServices) {
        try {
          console.log(`Trying ${service.name} geocoding service...`);
          const response = await fetch(service.url, {
            headers: {
              'User-Agent': 'BookingApp/1.0'
            }
          });
          
          if (!response.ok) continue;
          
          const data = await response.json();
          console.log(`${service.name} geocoding data:`, data);
          
          if (service.name === 'Nominatim' && data.address) {
            bestResult = { service: service.name, data };
            break; // Ưu tiên Nominatim
          } else if (service.name === 'Photon' && data.features && data.features[0]) {
            bestResult = { service: service.name, data: data.features[0] };
            break;
          }
        } catch (error) {
          console.warn(`${service.name} geocoding failed:`, error);
          continue;
        }
      }

      if (!bestResult) {
        throw new Error('All geocoding services failed');
      }

      const { service, data } = bestResult;
      console.log(`Using ${service} result:`, data);
      
      // Xử lý dữ liệu theo từng service
      let addressDetails: any = {};
      
      if (service === 'Nominatim') {
        addressDetails = data.address || {};
        console.log('Nominatim address details:', addressDetails);
      } else if (service === 'Photon') {
        const props = data.properties || {};
        addressDetails = {
          house_number: props.housenumber,
          road: props.street,
          neighbourhood: props.district,
          ward: props.suburb,
          county: props.county,
          city: props.city,
          state: props.state,
        };
      }
      
      // Tạo đối tượng chứa thông tin chi tiết với nhiều fallback options
      const detailedAddress = {
        houseNumber: addressDetails.house_number || addressDetails.housenumber || '',
        street: addressDetails.road || addressDetails.street || addressDetails.way || '',
        neighbourhood: addressDetails.neighbourhood || addressDetails.suburb || addressDetails.residential || '',
        // Ward trong Nominatim thường là suburb, quarter, village, hamlet
        ward: addressDetails.suburb || addressDetails.quarter || addressDetails.village || addressDetails.hamlet || addressDetails.neighbourhood || '',
        district: addressDetails.county || addressDetails.state_district || addressDetails.city_district || addressDetails.district || '',
        city: addressDetails.city || addressDetails.town || addressDetails.municipality || '',
        state: addressDetails.state || addressDetails.province || '',
        country: addressDetails.country || 'Việt Nam',
      };
      
      console.log('Detailed address extracted:', detailedAddress);
      
      // Tạo địa chỉ có định dạng chuẩn Việt Nam (Số nhà Tên đường, Phường/Xã, Quận/Huyện, Thành phố)
      let formattedAddress = '';
      
      // Số nhà + Tên đường (ưu tiên có số nhà)
      if (detailedAddress.houseNumber && detailedAddress.street) {
        formattedAddress += `${detailedAddress.houseNumber} ${detailedAddress.street}`;
      } else if (detailedAddress.street) {
        formattedAddress += detailedAddress.street;
      } else if (detailedAddress.neighbourhood) {
        formattedAddress += detailedAddress.neighbourhood;
      }
      
      // Phường/Xã (ưu tiên ward)
      if (detailedAddress.ward) {
        formattedAddress += formattedAddress ? `, ${detailedAddress.ward}` : detailedAddress.ward;
      } else if (detailedAddress.neighbourhood && detailedAddress.neighbourhood !== formattedAddress) {
        formattedAddress += formattedAddress ? `, ${detailedAddress.neighbourhood}` : detailedAddress.neighbourhood;
      }
      
      // Quận/Huyện
      if (detailedAddress.district) {
        formattedAddress += formattedAddress ? `, ${detailedAddress.district}` : detailedAddress.district;
      }
      
      // Thành phố
      if (detailedAddress.city) {
        formattedAddress += formattedAddress ? `, ${detailedAddress.city}` : detailedAddress.city;
      }
      
      // Tỉnh/Thành phố (nếu khác với city)
      if (detailedAddress.state && detailedAddress.state !== detailedAddress.city) {
        formattedAddress += formattedAddress ? `, ${detailedAddress.state}` : detailedAddress.state;
      }
      
      // Làm sạch địa chỉ (loại bỏ dấu phẩy thừa và khoảng trắng)
      formattedAddress = formattedAddress
        .replace(/,\s*,/g, ',')      // Loại bỏ dấu phẩy kép
        .replace(/^\s*,\s*/, '')     // Loại bỏ dấu phẩy đầu
        .replace(/\s*,\s*$/, '')     // Loại bỏ dấu phẩy cuối
        .trim();
      
      // Nếu không có đủ thông tin chi tiết, sử dụng display_name làm fallback
      if (!formattedAddress) {
        if (service === 'Nominatim') {
          formattedAddress = data.display_name || 'Không xác định được địa chỉ';
        } else if (service === 'Photon') {
          formattedAddress = data.properties?.name || data.properties?.street || 'Không xác định được địa chỉ';
        }
      }
      
      console.log('Final formatted address:', formattedAddress);
      
      // Lưu thông tin ward và city vào state để sử dụng khi tìm nhân viên
      if (detailedAddress.ward) {
        setSelectedCommuneName(detailedAddress.ward);
      }
      
      // City có thể là city hoặc state (Thành phố Hồ Chí Minh thường ở state)
      const cityName = detailedAddress.state || detailedAddress.city || '';
      if (cityName) {
        setSelectedProvinceName(cityName);
      }
      
      console.log('Saved ward:', detailedAddress.ward, 'city:', cityName);
      
      return formattedAddress;
    } catch (error) {
      console.error('Lỗi khi lấy địa chỉ:', error);
      return null;
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Hàm chọn nguồn địa chỉ
  const handleAddressSourceChange = async (source: 'profile' | 'current' | 'custom') => {
    console.log(`🏠 [ADDRESS] Switching address source to: ${source}`);
    setAddressSource(source);
    
    // Clear previous address data when switching source
    if (source === 'custom') {
      setCustomAddress('');
      setCurrentLocationAddress('');
      setMapCoordinates(null);
      // Reset địa chỉ 2 cấp
      setSelectedProvinceCode('');
      setSelectedProvinceName('');
      setSelectedCommuneCode('');
      setSelectedCommuneName('');
      setStreetAddress('');
      setManualAddress('');
      resetCommunes();
      // Clear default address info
      setDefaultAddressInfo(null);
    } else if (source === 'current') {
      setCustomAddress('');
      setCurrentLocationAddress('');
      // Tự động lấy vị trí hiện tại và hiển thị bản đồ
      getCurrentLocation();
      // Clear default address info
      setDefaultAddressInfo(null);
    } else if (source === 'profile') {
      setCustomAddress('');
      setCurrentLocationAddress('');
      setMapCoordinates(null);
      // Reset địa chỉ 2 cấp
      setSelectedProvinceCode('');
      setSelectedProvinceName('');
      setSelectedCommuneCode('');
      setSelectedCommuneName('');
      setStreetAddress('');
      setManualAddress('');
      resetCommunes();
      
      // Load default address info ngay khi chọn profile
      if (user?.customerId && !defaultAddressInfo) {
        try {
          console.log('🏠 [DEBUG] Loading default address info for profile source');
          const defaultAddress = await getDefaultAddress(user.customerId);
          
          if (defaultAddress && defaultAddress.addressId) {
            console.log('🏠 [SUCCESS] Got default address:', defaultAddress);
            
            // Lưu tất cả thông tin cần thiết
            setDefaultAddressInfo({
              addressId: defaultAddress.addressId,
              ward: defaultAddress.ward || '',
              city: defaultAddress.city || '',
              latitude: defaultAddress.latitude,
              longitude: defaultAddress.longitude
            });
            
            // Cập nhật coordinates nếu có
            if (defaultAddress.latitude && defaultAddress.longitude) {
              setMapCoordinates({
                lat: defaultAddress.latitude,
                lng: defaultAddress.longitude
              });
            }
          }
        } catch (error) {
          console.error('🏠 [ERROR] Failed to load default address:', error);
        }
      }
    }
  };

  // Xử lý khi chọn tỉnh/thành phố
  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceCode = e.target.value;
    const province = provinces.find(p => p.code === provinceCode);
    
    setSelectedProvinceCode(provinceCode);
    setSelectedProvinceName(province?.name || '');
    
    // Reset commune selection
    setSelectedCommuneCode('');
    setSelectedCommuneName('');
    
    // Load communes for selected province
    if (provinceCode) {
      await loadCommunes(provinceCode);
    } else {
      resetCommunes();
    }
    
    // Update full address
    updateFullAddress(streetAddress, '', province?.name || '');
  };

  // Xử lý khi chọn phường/xã
  const handleCommuneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const communeCode = e.target.value;
    const commune = communes.find(c => c.code === communeCode);
    
    setSelectedCommuneCode(communeCode);
    setSelectedCommuneName(commune?.name || '');
    
    // Update full address
    updateFullAddress(streetAddress, commune?.name || '', selectedProvinceName);
  };

  // Xử lý khi nhập số nhà, tên đường
  const handleStreetAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStreetAddress(value);
    
    // Update full address
    updateFullAddress(value, selectedCommuneName, selectedProvinceName);
  };

  // Cập nhật địa chỉ đầy đủ
  const updateFullAddress = (street: string, commune: string, province: string) => {
    const fullAddr = getFullAddress({
      provinceCode: selectedProvinceCode,
      provinceName: province,
      communeCode: selectedCommuneCode,
      communeName: commune,
      streetAddress: street,
      fullAddress: ''
    });
    
    setBookingData(prev => ({ ...prev, address: fullAddr }));
    
    if (addressSource === 'custom') {
      setCustomAddress(fullAddr);
    }
  };

  // Xử lý nhập địa chỉ thủ công
  const handleManualAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setManualAddress(value);
    setBookingData(prev => ({ ...prev, address: value }));
    
    if (addressSource === 'custom') {
      setCustomAddress(value);
    }
  };

  // Toggle giữa nhập có hỗ trợ và nhập thủ công
  const toggleAddressInputMode = () => {
    setIsManualAddress(!isManualAddress);
    
    if (!isManualAddress) {
      // Switching to manual mode - preserve current address
      setManualAddress(bookingData.address);
    } else {
      // Switching back to assisted mode - clear manual input
      setManualAddress('');
      updateFullAddress(streetAddress, selectedCommuneName, selectedProvinceName);
    }
  };


  
  // Hàm tạo địa chỉ đầy đủ từ các trường chi tiết với state hiện tại
  // const generateFullAddress = (): string => {
  //   const { houseNumber, alley, street, ward, city } = addressDetails;
  //   let parts = [];
  //   
  //   if (houseNumber) parts.push(`Số ${houseNumber}`);
  //   if (alley) parts.push(`Hẻm ${alley}`);
  //   if (street) parts.push(`Đường ${street}`);
  //   if (ward) parts.push(`Phường ${ward}`);
  //   if (city) parts.push(city);
  //   
  //   return parts.join(', ');
  // };
  
  // Khởi tạo và cập nhật bản đồ khi có tọa độ và khi step là 2 (trang địa điểm)
  useEffect(() => {
    // Chỉ khởi tạo bản đồ nếu có tọa độ, container đã mount, và đang ở step 2
    if (mapCoordinates && mapContainerRef.current && step === 2 && addressSource === 'current') {
      console.log("Initializing map with coordinates:", mapCoordinates);
      
      // Nếu bản đồ chưa được khởi tạo
      if (!mapInstanceRef.current) {
        // Khởi tạo icon mặc định cho marker
        const defaultIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        // Khởi tạo bản đồ
        const map = L.map(mapContainerRef.current).setView([mapCoordinates.lat, mapCoordinates.lng], 16);
        
        // Thêm layer OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Thêm marker
        const marker = L.marker([mapCoordinates.lat, mapCoordinates.lng], { icon: defaultIcon }).addTo(map);
        marker.bindPopup('Vị trí của bạn').openPopup();
        
        // Lưu instance bản đồ và marker vào ref
        mapInstanceRef.current = map;
        markerRef.current = marker;
      } else {
        // Nếu bản đồ đã được khởi tạo, chỉ cập nhật view và vị trí marker
        mapInstanceRef.current.setView([mapCoordinates.lat, mapCoordinates.lng], 16);
        
        if (markerRef.current) {
          markerRef.current.setLatLng([mapCoordinates.lat, mapCoordinates.lng]);
        }
      }
    }
    
    // Dọn dẹp khi component unmount hoặc khi thay đổi step/addressSource
    return () => {
      if (mapInstanceRef.current && (step !== 2 || addressSource !== 'current')) {
        console.log("Cleaning up map instance");
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [mapCoordinates, step, addressSource]);

  // Hàm chuyển đổi giữa lựa chọn preset và tùy chỉnh thời gian
  // const handleTimeInputTypeChange = (type: 'preset' | 'custom') => {
  //   setTimeInputType(type);
  //   
  //   if (type === 'custom') {
  //     // Nếu chuyển sang chế độ tùy chỉnh, dùng giá trị tùy chỉnh nếu có
  //     if (customTimeInput) {
  //       setBookingData(prev => ({ ...prev, time: customTimeInput }));
  //     }
  //   } else {
  //     // Nếu chuyển sang chế độ preset, xóa giá trị thời gian đã chọn
  //     setBookingData(prev => ({ ...prev, time: '' }));
  //   }
  // };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  // Function to toggle service options (add/remove from selected options)
  // const handleOptionSelect = (option: { id: number, name: string }) => {
  //   setSelectedOptions(prevOptions => {
  //     // Check if the option is already selected
  //     const isSelected = prevOptions.some(item => item.id === option.id);
  //     
  //     if (isSelected) {
  //       // If already selected, remove it
  //       return prevOptions.filter(item => item.id !== option.id);
  //     } else {
  //       // If not selected, add it
  //       return [...prevOptions, option];
  //     }
  //   });
  // };

  // Import hook for booking functionality moved to top of component

  // Handle service selection - load options when service changes
  const handleServiceSelect = async (serviceId: string) => {
    setBookingData(prev => ({ ...prev, serviceId }));
    setSelectedChoiceIds([]);
    clearServiceOptions();
    clearPriceData();
    
    if (serviceId) {
      await loadServiceOptions(parseInt(serviceId));
    }
  };

  // Handle option selection
  const handleOptionSelect = (choiceId: number, _choiceName: string, isMultiple: boolean = false) => {
    if (isMultiple) {
      // For multiple choice options
      setSelectedChoiceIds(prev => {
        const exists = prev.includes(choiceId);
        if (exists) {
          return prev.filter(id => id !== choiceId);
        } else {
          return [...prev, choiceId];
        }
      });
    } else {
      // For single choice options
      setSelectedChoiceIds([choiceId]);
    }
  };

  // Calculate price when options change
  const handlePriceCalculation = async () => {
    if (bookingData.serviceId) {
      // API expects simple format: { serviceId, selectedChoiceIds, quantity }
      await calculateServicePrice({
        serviceId: parseInt(bookingData.serviceId),
        selectedChoiceIds: selectedChoiceIds,
        quantity: 1
      });
    }
  };

  // Load suitable employees
  const handleLoadSuitableEmployees = async () => {
    // Clear previous error messages
    setEmployeeSelectionErrors([]);
    
    // Validate required fields
    const validationErrors: string[] = [];
    
    if (!bookingData.serviceId) {
      validationErrors.push('Vui lòng chọn dịch vụ trước khi tìm nhân viên');
    }
    
    if (bookingData.bookingTimes.length === 0) {
      validationErrors.push('Vui lòng thêm ít nhất một mốc thời gian trước khi tìm nhân viên');
    }

    if (!bookingData.duration || bookingData.duration <= 0) {
      validationErrors.push('Vui lòng chọn thời lượng dự kiến trước khi tìm nhân viên');
    }
    
    // If there are validation errors, show them locally and return
    if (validationErrors.length > 0) {
      setEmployeeSelectionErrors(validationErrors);
      return;
    }
    
    // If all validations pass, proceed to load suitable employees
    // Sử dụng thời gian đầu tiên để tìm nhân viên
    if (bookingData.serviceId && bookingData.bookingTimes.length > 0 && bookingData.duration) {
      const bookingDateTime = bookingData.bookingTimes[0]; // Dùng thời gian đầu tiên
      
      // Xác định ward và city dựa trên addressSource
      let ward = '';
      let city = '';
      
      if (addressSource === 'profile' && defaultAddressInfo) {
        // Sử dụng thông tin từ default address API
        ward = defaultAddressInfo.ward;
        city = defaultAddressInfo.city;
        console.log('🏠 [EMPLOYEE_SEARCH] Using profile address - ward:', ward, 'city:', city);
      } else if (addressSource === 'custom') {
        // Sử dụng thông tin từ địa chỉ tùy chỉnh
        ward = selectedCommuneName || '';
        city = selectedProvinceName || '';
        console.log('🏠 [EMPLOYEE_SEARCH] Using custom address - ward:', ward, 'city:', city);
      } else if (addressSource === 'current') {
        // Sử dụng thông tin từ vị trí hiện tại (nếu có geocoding)
        ward = selectedCommuneName || '';
        city = selectedProvinceName || '';
        console.log('🏠 [EMPLOYEE_SEARCH] Using current location - ward:', ward, 'city:', city);
        console.log('🏠 [EMPLOYEE_SEARCH] State values - selectedCommuneName:', selectedCommuneName, 'selectedProvinceName:', selectedProvinceName);
      }
      
      // Fallback values nếu không có thông tin
      if (!ward) {
        console.warn('🏠 [EMPLOYEE_SEARCH] No ward found, using fallback');
        ward = 'Phường Tây Thạnh';
      }
      if (!city) {
        console.warn('🏠 [EMPLOYEE_SEARCH] No city found, using fallback');
        city = 'TP. Hồ Chí Minh';
      }
      
      console.log('🏠 [EMPLOYEE_SEARCH] Final values - ward:', ward, 'city:', city);
      
      try {
        await loadSuitableEmployees({
          serviceId: parseInt(bookingData.serviceId),
          bookingTime: bookingDateTime,
          ward: ward,
          city: city,
          latitude: mapCoordinates?.lat ,
          longitude: mapCoordinates?.lng
        });
      } catch (error) {
        setEmployeeSelectionErrors(['Không thể tải danh sách nhân viên phù hợp. Vui lòng thử lại sau.']);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      // Clear previous errors and validate form data
      setErrorMessages([]);
      
      // Use validation helper function
      const validationErrors = validateBookingForm(bookingData);
      
      if (validationErrors.length > 0) {
        setErrorMessages(validationErrors);
        return;
      }

      // Validate service ID
      const serviceId = parseInt(bookingData.serviceId);
      if (isNaN(serviceId) || serviceId <= 0) {
        setErrorMessages(['Mã dịch vụ không hợp lệ']);
        return;
      }

      // Handle address selection logic
      let addressId: string | null = null;
      let newAddress: any = null;

      if (!user?.customerId) {
        console.error('🏠 [ERROR] No customerId found in user data');
        setErrorMessages(['Lỗi xác thực người dùng. Vui lòng đăng nhập lại.']);
        return;
      }

      if (addressSource === 'profile') {
        // Use default address from profile
        if (defaultAddressInfo?.addressId) {
          addressId = defaultAddressInfo.addressId;
          console.log('🏠 [SUCCESS] Using cached addressId:', addressId);
        } else {
          // Fallback: fetch from API
          try {
            console.log('🏠 [DEBUG] Default address not cached, fetching from API');
            const defaultAddress = await getDefaultAddress(user.customerId);
            
            if (defaultAddress && defaultAddress.addressId) {
              addressId = defaultAddress.addressId;
              console.log('🏠 [SUCCESS] Got addressId from API:', addressId);
              
              setDefaultAddressInfo({
                addressId: defaultAddress.addressId,
                ward: defaultAddress.ward || '',
                city: defaultAddress.city || '',
                latitude: defaultAddress.latitude,
                longitude: defaultAddress.longitude
              });
            } else {
              console.error('🏠 [ERROR] API returned empty or invalid address data:', defaultAddress);
              setErrorMessages(['Không thể lấy địa chỉ mặc định từ hệ thống. Vui lòng liên hệ hỗ trợ.']);
              return;
            }
          } catch (error) {
            console.error('🏠 [ERROR] Failed to get default address from API:', error);
            setErrorMessages(['Không thể kết nối tới hệ thống để lấy địa chỉ. Vui lòng thử lại sau.']);
            return;
          }
        }
      } else if (addressSource === 'current' || addressSource === 'custom') {
        // Use new address
        let finalAddress = '';
        
        if (addressSource === 'current') {
          finalAddress = currentLocationAddress;
        } else if (addressSource === 'custom') {
          finalAddress = isManualAddress ? manualAddress : bookingData.address;
        }
        
        const finalCoordinates = addressSource === 'current' ? mapCoordinates : null;
        
        if (!finalAddress || !finalAddress.trim()) {
          setErrorMessages(['Vui lòng nhập địa chỉ đầy đủ']);
          return;
        }

        // Create newAddress object for API
        let ward = '';
        let city = '';
        
        if (addressSource === 'custom' && !isManualAddress) {
          ward = selectedCommuneName || '';
          city = selectedProvinceName || '';
        } else {
          city = 'Thành phố Hồ Chí Minh';
        }
        
        newAddress = {
          customerId: user.customerId,
          fullAddress: finalAddress,
          ward: ward,
          city: city,
          latitude: finalCoordinates?.lat || null,
          longitude: finalCoordinates?.lng || null
        };
        
        console.log('🏠 [DEBUG] Using new address:', newAddress);
      }

      // Use calculated price from API if available
      const estimatedPrice = priceData?.finalPrice || (services.find(s => s.serviceId === serviceId)?.basePrice || 0);

      // Convert data to match API request format
      const bookingRequest = {
        addressId: addressId || null,
        newAddress: newAddress || undefined,
        bookingTimes: bookingData.bookingTimes, // Mảng các mốc thời gian
        note: bookingData.notes || null,
        promoCode: bookingData.promoCode || null,
        ...(selectedEmployees.length === 0 && {
          title: postTitle.trim() || null,
        }),
        bookingDetails: [
          {
            serviceId: serviceId,
            quantity: 1,
            expectedPrice: estimatedPrice,
            expectedPricePerUnit: estimatedPrice,
            selectedChoiceIds: selectedChoiceIds
          }
        ],
        assignments: selectedEmployees.length > 0 ? selectedEmployees.map(employeeId => ({
          serviceId: serviceId,
          employeeId: employeeId
        })) : undefined,
        paymentMethodId: parseInt(bookingData.paymentMethod) || 1
      };

      // Debug: Log booking request
      console.log('📋 [REQUEST] Sending booking request with multiple times:', JSON.stringify(bookingRequest, null, 2));
      
      // Additional validation before sending
      if (!bookingRequest.addressId && !bookingRequest.newAddress) {
        console.error('❌ [VALIDATION] Neither addressId nor newAddress is provided!');
        setErrorMessages(['Lỗi: Thiếu thông tin địa chỉ. Vui lòng kiểm tra lại.']);
        return;
      }
      
      // Call API to create bookings (API tự detect bookingTimes và tạo nhiều booking)
      const imageFiles = postImageFiles.length > 0 ? postImageFiles : undefined;
      const result = await createBooking(bookingRequest, imageFiles);
      
      if (result) {
        console.log('✅ [BOOKING] Bookings created successfully:', result);
        
        // Kiểm tra response structure
        // Single booking: result.data = { bookingId, bookingCode, ... }
        // Multiple bookings: result.data = { totalBookingsCreated, bookings: [...], ... }
        const responseData = result.data || result;
        const isMultiple = responseData.bookings && Array.isArray(responseData.bookings);
        
        // Navigate tới trang success
        navigate('/customer/booking-success', {
          state: {
            bookingData: isMultiple ? responseData : result,
            isMultiple: isMultiple
          }
        });
      } else {
        const errorMsg = bookingError || 'Đặt lịch thất bại. Vui lòng thử lại sau.';
        setErrorMessages([errorMsg]);
      }
    } catch (error: any) {
      console.error('Booking submission error:', error);
      
      let errorMessage = 'Có lỗi xảy ra';
      
      if (error.response) {
        console.error('Server response error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        errorMessage = error.response.data?.message || `Lỗi server (${error.response.status})`;
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'Không nhận được phản hồi từ server';
      } else {
        console.error('Request setup error:', error.message);
        errorMessage = error.message || 'Lỗi khi gửi yêu cầu';
      }
      
      alert(`Đặt lịch thất bại: ${errorMessage}. Vui lòng thử lại sau.`);
    }
  };

  const selectedService = services.find(s => s.serviceId === parseInt(bookingData.serviceId));
  const estimatedPrice = selectedService && bookingData.duration 
    ? selectedService.basePrice * (bookingData.duration / (selectedService.estimatedDurationHours * 60 || 120)) 
    : 0;

  const getServiceIcon = (category: string) => {
    switch (category) {
      case 'cleaning': return '🏠';
      case 'cooking': return '👨‍🍳';
      case 'laundry': return '👔';
      case 'care': return '❤️';
      case 'childcare': return '👶';
      default: return '🛠️';
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Chọn dịch vụ phù hợp</h3>
              <p className="text-gray-600">Tìm và chọn dịch vụ mà bạn cần sử dụng</p>
            </div>
            
            {/* Categories Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Danh mục dịch vụ
                </h4>
                {selectedCategoryId && (
                  <button 
                    onClick={async () => {
                      setSelectedCategoryId(null);
                      setLoadingCategoryServices(true);
                      try {
                        await resetCategoryFilter();
                      } catch (error) {
                        setErrorMessages(['Không thể tải lại tất cả dịch vụ']);
                      } finally {
                        setLoadingCategoryServices(false);
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center px-3 py-1 rounded-full bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Xóa bộ lọc
                  </button>
                )}
              </div>

              {categoriesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Đang tải danh mục...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {categories.map((category) => (
                    <div
                      key={category.categoryId}
                      onClick={async () => {
                        setSelectedCategoryId(category.categoryId);
                        setLoadingCategoryServices(true);
                        try {
                          await selectCategory(category.categoryId);
                        } catch (error) {
                          setErrorMessages([`Không thể tải dịch vụ từ danh mục ${category.categoryName}`]);
                        } finally {
                          setLoadingCategoryServices(false);
                        }
                      }}
                      className={`group relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 h-[140px] shadow-sm hover:shadow-lg transform hover:-translate-y-1 ${
                        selectedCategoryId === category.categoryId
                          ? 'border-blue-500 bg-white shadow-blue-100 ring-2 ring-blue-100'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      {selectedCategoryId === category.categoryId && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div className="flex flex-col items-center justify-between h-full">
                        <div className="w-16 h-16 mb-3 flex items-center justify-center">
                          {category.iconUrl ? (
                            <img src={category.iconUrl} alt={category.categoryName} className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-xl">{category.categoryName.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">{category.categoryName}</span>
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{category.serviceCount} dịch vụ</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Services Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                {selectedCategoryId 
                  ? `Dịch vụ thuộc ${categories.find(c => c.categoryId === selectedCategoryId)?.categoryName}` 
                  : "Tất cả dịch vụ"}
              </h4>
              
              {categoriesLoading || loadingCategoryServices ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {(categoryWithServices ? categoryWithServices.services : services).map((service) => (
                    <div
                      key={service.serviceId}
                      className={`group p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                        bookingData.serviceId === service.serviceId.toString()
                          ? 'border-blue-500 bg-blue-50 shadow-blue-100 ring-2 ring-blue-100'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                      onClick={() => handleServiceSelect(service.serviceId.toString())}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            {service.iconUrl ? (
                              <img src={service.iconUrl} alt={service.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-2xl">{getServiceIcon(service.categoryName || 'other')}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                              {service.name}
                            </h4>
                            {bookingData.serviceId === service.serviceId.toString() && (
                              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ml-2">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                {service.basePrice.toLocaleString('vi-VN')}đ
                              </div>
                              <div className="flex items-center text-gray-500 text-sm">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {service.estimatedDurationHours * 60} phút
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Service Options Section */}
            {bookingData.serviceId && serviceOptions && serviceOptions.options && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                  Tùy chọn dịch vụ
                </h4>
                <div className="space-y-6">
                  {serviceOptions.options.map((option) => (
                    <div key={option.optionId} className="bg-white rounded-lg p-4 shadow-sm border border-amber-100">
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        {option.optionName} 
                        {option.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      {option.optionType === 'SINGLE_CHOICE_RADIO' && option.choices && (
                        <div className="space-y-3">
                          {option.choices.map((choice) => (
                            <label key={choice.choiceId} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                              <input
                                type="radio"
                                name={`option-${option.optionId}`}
                                value={choice.choiceId}
                                checked={selectedChoiceIds.includes(choice.choiceId)}
                                onChange={() => handleOptionSelect(choice.choiceId, choice.choiceName, false)}
                                className="mr-3 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="font-medium">{choice.choiceName}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {option.optionType === 'SINGLE_CHOICE_DROPDOWN' && (
                        <select 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          onChange={(e) => {
                            const choiceId = parseInt(e.target.value);
                            const choice = option.choices?.find(c => c.choiceId === choiceId);
                            if (choice) {
                              handleOptionSelect(choiceId, choice.choiceName, false);
                            }
                          }}
                          value={selectedChoiceIds.find(id => option.choices?.some(c => c.choiceId === id)) || ''}
                        >
                          <option value="">Chọn {option.optionName.toLowerCase()}</option>
                          {option.choices && option.choices.map((choice) => (
                            <option key={choice.choiceId} value={choice.choiceId}>
                              {choice.choiceName}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {option.optionType === 'MULTIPLE_CHOICE_CHECKBOX' && option.choices && (
                        <div className="space-y-3">
                          {option.choices.map((choice) => (
                            <label key={choice.choiceId} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedChoiceIds.includes(choice.choiceId)}
                                onChange={() => handleOptionSelect(choice.choiceId, choice.choiceName, true)}
                                className="mr-3 text-blue-600 focus:ring-blue-500 rounded"
                              />
                              <span className="font-medium">{choice.choiceName}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {option.optionType === 'QUANTITY_INPUT' && (
                        <input
                          type="number"
                          min="1"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder={`Nhập ${option.optionName.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Enhanced Price Calculation Display */}
                {priceData && (
                  <div className="mt-6 bg-white rounded-xl p-6 border-2 border-blue-200 shadow-sm">
                    <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Chi phí ước tính
                    </h5>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Giá cơ bản:</span>
                        <span className="font-medium">{priceData.basePrice.toLocaleString('vi-VN')}đ</span>
                      </div>
                      {priceData.breakdown?.selectedOptions && priceData.breakdown.selectedOptions.length > 0 && (
                        <div className="space-y-2">
                          {priceData.breakdown.selectedOptions.map((opt: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-gray-600">{opt.choiceName}:</span>
                              <span className={`font-medium ${opt.priceAdjustment > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {opt.priceAdjustment > 0 ? '+' : ''}{opt.priceAdjustment.toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                          <span className="text-2xl font-bold text-blue-600">{priceData.finalPrice.toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 mt-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-700">Thời gian: <strong>{priceData.estimatedDurationHours ? `${priceData.estimatedDurationHours}h` : 'Đang tính'}</strong></span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            <span className="text-gray-700">Nhân viên: <strong>{priceData.suggestedStaff ?? 1}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Địa điểm thực hiện</h3>
              <p className="text-gray-600">Chọn hoặc nhập địa chỉ nơi bạn muốn sử dụng dịch vụ</p>
            </div>

            <div className="space-y-6">
              {/* Lựa chọn nguồn địa chỉ */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Chọn địa chỉ
                </h4>
                
                {/* Địa chỉ từ thông tin người dùng */}
                <div 
                  className={`group p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                    addressSource === 'profile' 
                      ? 'border-blue-500 bg-blue-50 shadow-blue-100 ring-2 ring-blue-100' 
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
                  }`}
                  onClick={() => handleAddressSourceChange('profile')}
                >
                  <div className="flex items-start">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-all ${
                      addressSource === 'profile' ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-50'
                    }`}>
                      <User className={`w-6 h-6 ${
                        addressSource === 'profile' ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="font-semibold text-gray-900">Địa chỉ mặc định</h4>
                        {addressSource === 'profile' && (
                          <div className="ml-3 flex items-center">
                            <CheckCircle className="w-5 h-5 text-blue-600 mr-1" />
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Đã chọn</span>
                          </div>
                        )}
                      </div>
                      {user?.profileData && 'address' in user.profileData && user.profileData.address ? (
                        <p className="text-gray-600 mb-2">{user.profileData.address}</p>
                      ) : (
                        <p className="text-gray-600 mb-2">Sử dụng địa chỉ mặc định từ hệ thống</p>
                      )}
                      <p className="text-sm text-blue-600">✓ Nhanh chóng và tiện lợi</p>
                    </div>
                  </div>
                </div>
                
                {/* Lấy địa chỉ hiện tại */}
                <div 
                  className={`group p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                    addressSource === 'current' 
                      ? 'border-blue-500 bg-blue-50 shadow-blue-100 ring-2 ring-blue-100' 
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
                  }`}
                  onClick={() => handleAddressSourceChange('current')}
                >
                  <div className="flex items-start">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-all ${
                      addressSource === 'current' ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-50'
                    }`}>
                      <NavigationIcon className={`w-6 h-6 ${
                        addressSource === 'current' ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="font-semibold text-gray-900">Vị trí hiện tại</h4>
                        {addressSource === 'current' && (
                          <div className="ml-3 flex items-center">
                            <CheckCircle className="w-5 h-5 text-blue-600 mr-1" />
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Đã chọn</span>
                          </div>
                        )}
                      </div>
                      {addressSource === 'current' && isLoadingLocation && (
                        <p className="text-blue-600 flex items-center">
                          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                          Đang xác định vị trí...
                        </p>
                      )}
                      {addressSource === 'current' && !isLoadingLocation && currentLocationAddress && (
                        <p className="text-gray-600 mb-2">{currentLocationAddress}</p>
                      )}
                      {(!currentLocationAddress || addressSource !== 'current') && (
                        <p className="text-gray-600 mb-2">Sử dụng GPS để xác định vị trí hiện tại của bạn</p>
                      )}
                      <p className="text-sm text-green-600">✓ Chính xác và tự động</p>
                    </div>
                  </div>
                </div>
                
                {/* Nhập địa chỉ tùy chỉnh */}
                <div 
                  className={`group p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                    addressSource === 'custom' 
                      ? 'border-blue-500 bg-blue-50 shadow-blue-100 ring-2 ring-blue-100' 
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
                  }`}
                  onClick={() => handleAddressSourceChange('custom')}
                >
                  <div className="flex items-start">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-all ${
                      addressSource === 'custom' ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-50'
                    }`}>
                      <MapPin className={`w-6 h-6 ${
                        addressSource === 'custom' ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="font-semibold text-gray-900">Địa chỉ khác</h4>
                        {addressSource === 'custom' && (
                          <div className="ml-3 flex items-center">
                            <CheckCircle className="w-5 h-5 text-blue-600 mr-1" />
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Đã chọn</span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">Nhập địa chỉ chi tiết khác</p>
                      <p className="text-sm text-purple-600">✓ Linh hoạt và tùy chỉnh</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Hiển thị form tương ứng với lựa chọn */}
              {addressSource === 'current' && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <NavigationIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Xác định vị trí hiện tại
                  </h5>
                  
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                    className="mb-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
                  >
                    {isLoadingLocation ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Đang xác định vị trí...
                      </>
                    ) : (
                      <>
                        <NavigationIcon className="w-5 h-5 mr-2" />
                        Lấy vị trí hiện tại
                      </>
                    )}
                  </button>
                  
                  {currentLocationAddress && (
                    <div className="space-y-4">
                      <div className="p-4 bg-white border border-green-200 rounded-lg shadow-sm">
                        <div className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-green-800 mb-1">Địa chỉ đã xác định</p>
                            <p className="text-gray-700">{currentLocationAddress}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Hiển thị bản đồ nếu có tọa độ */}
                  {mapCoordinates && (
                    <div className="mt-4">
                      <h6 className="font-medium text-gray-900 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                        </svg>
                        Vị trí trên bản đồ
                      </h6>
                      {addressSource === 'current' && (
                        <div className="mb-3 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Nhấp trên bản đồ để điều chỉnh vị trí chính xác
                          </p>
                        </div>
                      )}
                      <div 
                        ref={mapContainerRef}
                        className={`w-full h-64 rounded-lg border border-gray-300 shadow-sm ${
                          addressSource === 'current' ? 'cursor-crosshair' : ''
                        }`}
                      ></div>
                    </div>
                  )}
                </div>
              )}

              {addressSource === 'custom' && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-semibold text-gray-900 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-purple-600" />
                      Nhập địa chỉ chi tiết
                    </h5>
                    
                    <button
                      type="button"
                      onClick={toggleAddressInputMode}
                      className="px-3 py-1.5 text-sm bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      {isManualAddress ? '✏️ Nhập có hỗ trợ' : '⌨️ Nhập thủ công'}
                    </button>
                  </div>
                  
                  {!isManualAddress ? (
                    <div className="space-y-4">
                      {/* Form có hỗ trợ - Địa chỉ 2 cấp */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Tỉnh/Thành phố */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Tỉnh/Thành phố <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedProvinceCode}
                            onChange={handleProvinceChange}
                            disabled={isLoadingProvinces}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">-- Chọn tỉnh/thành phố --</option>
                            {provinces.map(province => (
                              <option key={province.code} value={province.code}>
                                {province.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Phường/Xã */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Phường/Xã <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedCommuneCode}
                            onChange={handleCommuneChange}
                            disabled={!selectedProvinceCode || isLoadingCommunes}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">-- Chọn phường/xã --</option>
                            {communes.map(commune => (
                              <option key={commune.code} value={commune.code}>
                                {commune.name}
                              </option>
                            ))}
                          </select>
                          {!selectedProvinceCode && (
                            <p className="text-xs text-gray-500 mt-1">Vui lòng chọn tỉnh/thành phố trước</p>
                          )}
                        </div>
                      </div>

                      {/* Số nhà, tên đường */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Số nhà, tên đường <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={streetAddress}
                          onChange={handleStreetAddressChange}
                          placeholder="Ví dụ: 123 Nguyễn Văn Linh"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                      </div>

                      {/* Hiển thị địa chỉ đầy đủ */}
                      {bookingData.address && (
                        <div className="p-4 bg-white border border-purple-200 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">Địa chỉ đầy đủ:</p>
                          <p className="text-gray-900">{bookingData.address}</p>
                        </div>
                      )}

                      {/* Validation warning */}
                      {(!selectedProvinceCode || !selectedCommuneCode || !streetAddress.trim()) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-sm text-amber-800 flex items-start">
                            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>
                              <strong>Chưa đủ thông tin:</strong> Vui lòng điền đầy đủ các trường có dấu <span className="text-red-500">*</span> để tiếp tục.
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Form nhập thủ công */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Địa chỉ đầy đủ <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={manualAddress}
                          onChange={handleManualAddressChange}
                          placeholder="Ví dụ: 123 Nguyễn Văn Linh, Phường An Phú, Thành phố Hồ Chí Minh"
                          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                          rows={4}
                        />
                      </div>

                      {/* Hướng dẫn */}
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <p className="text-sm text-gray-600">
                          💡 <strong>Lưu ý:</strong> Nhập địa chỉ đầy đủ theo định dạng: 
                          Số nhà Tên đường, Phường/Xã, Tỉnh/Thành phố
                        </p>
                      </div>

                      {/* Validation warning */}
                      {!manualAddress.trim() && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-sm text-amber-800 flex items-start">
                            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>
                              <strong>Chưa nhập địa chỉ:</strong> Vui lòng nhập địa chỉ đầy đủ để tiếp tục.
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {addressSource === 'profile' && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold text-green-900 mb-2">Sử dụng địa chỉ mặc định</h5>
                      <p className="text-green-800 mb-3">
                        Hệ thống sẽ sử dụng địa chỉ mặc định từ hồ sơ của bạn. 
                        Điều này giúp quá trình đặt lịch nhanh chóng và thuận tiện hơn.
                      </p>
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <p className="text-sm text-gray-600">
                          💡 <strong>Lưu ý:</strong> Vui lòng đảm bảo địa chỉ trong hồ sơ của bạn đã chính xác và đầy đủ.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Lên lịch thời gian</h3>
              <p className="text-gray-600">Chọn một hoặc nhiều mốc thời gian để đặt dịch vụ</p>
            </div>

            <div className="space-y-6">
              {/* Unified Time Selection with Tabs */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Tab Header */}
                <div className="flex border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => setTimeSelectionMode('single')}
                    className={`flex-1 px-4 py-4 text-sm font-semibold transition-all ${
                      timeSelectionMode === 'single'
                        ? 'bg-brand-teal/10 text-brand-teal border-b-2 border-brand-teal'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="hidden sm:inline">Chọn từng ngày</span>
                      <span className="sm:hidden">Từng ngày</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeSelectionMode('week')}
                    className={`flex-1 px-4 py-4 text-sm font-semibold transition-all relative ${
                      timeSelectionMode === 'week'
                        ? 'bg-brand-teal/10 text-brand-teal border-b-2 border-brand-teal'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="hidden sm:inline">Chọn theo tuần</span>
                      <span className="sm:hidden">Theo tuần</span>
                     
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeSelectionMode('monthly')}
                    className={`flex-1 px-4 py-4 text-sm font-semibold transition-all relative ${
                      timeSelectionMode === 'monthly'
                        ? 'bg-brand-teal/10 text-brand-teal border-b-2 border-brand-teal'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        <circle cx="12" cy="14" r="1.5" />
                        <circle cx="16" cy="14" r="1.5" />
                        <circle cx="8" cy="14" r="1.5" />
                      </svg>
                      <span className="hidden sm:inline">Định kỳ theo tháng</span>
                      <span className="sm:hidden">Theo tháng</span>
                    </div>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {timeSelectionMode === 'single' && (
                    /* Single Date/Time Selection */
                    <div className="space-y-4">
                      {/* Quick Date Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ⚡ Chọn nhanh ngày
                        </label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {[
                            { label: 'Hôm nay', days: 0 },
                            { label: 'Mai', days: 1 },
                            { label: 'Ngày kia', days: 2 },
                            { label: '+3 ngày', days: 3 },
                            { label: '+1 tuần', days: 7 },
                            { label: '+2 tuần', days: 14 }
                          ].map(({ label, days }) => {
                            const date = new Date();
                            date.setDate(date.getDate() + days);
                            const dateStr = date.toISOString().split('T')[0];
                            const isSelected = tempDate === dateStr;
                            
                            return (
                              <button
                                key={days}
                                type="button"
                                onClick={() => setTempDate(dateStr)}
                                className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                                  isSelected
                                    ? 'bg-brand-teal text-white shadow-lg scale-105'
                                    : 'bg-brand-teal/10 text-brand-teal border border-brand-teal/30 hover:bg-brand-teal/20'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Date Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hoặc chọn ngày cụ thể <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              value={tempDate}
                              onChange={(e) => setTempDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full p-3 pl-11 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-brand-teal bg-white text-gray-900 font-medium transition-all hover:border-brand-teal/50 cursor-pointer"
                              style={{
                                colorScheme: 'light'
                              }}
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-teal pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Time Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chọn giờ <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="time"
                              value={tempTime}
                              onChange={(e) => setTempTime(e.target.value)}
                              className="w-full p-3 pl-11 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-brand-teal bg-white text-gray-900 font-medium transition-all hover:border-brand-teal/50 cursor-pointer"
                              style={{
                                colorScheme: 'light'
                              }}
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-teal pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Time Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ⚡ Chọn nhanh giờ phổ biến
                        </label>
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                          {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map(time => {
                            const isSelected = tempTime === time;
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => setTempTime(time)}
                                className={`p-2 rounded-lg text-sm font-semibold transition-all ${
                                  isSelected
                                    ? 'bg-brand-teal text-white shadow-lg scale-105'
                                    : 'bg-brand-teal/10 text-brand-teal border border-brand-teal/30 hover:bg-brand-teal/20'
                                }`}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleAddBookingTime}
                        className="w-full px-6 py-3 bg-gradient-to-r from-brand-navy to-brand-teal text-white rounded-lg hover:from-brand-navyHover hover:to-brand-teal transition-all flex items-center justify-center font-medium shadow-md"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Thêm mốc thời gian
                      </button>
                    </div>
                  )}
                  
                  {timeSelectionMode === 'week' && (
                    /* Week Selection Mode */
                    <div className="space-y-4">
                      {/* Quick Week Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ⚡ Chọn nhanh tuần
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            { label: 'Tuần này', weeks: 0 },
                            { label: 'Tuần sau', weeks: 1 },
                            { label: '+2 tuần', weeks: 2 },
                            { label: '+3 tuần', weeks: 3 }
                          ].map(({ label, weeks }) => {
                            const date = new Date();
                            date.setDate(date.getDate() + (weeks * 7));
                            const dateStr = date.toISOString().split('T')[0];
                            const isSelected = weekStartDate === dateStr;
                            
                            return (
                              <button
                                key={weeks}
                                type="button"
                                onClick={() => setWeekStartDate(dateStr)}
                                className={`p-2 rounded-lg text-sm font-semibold transition-all ${
                                  isSelected
                                    ? 'bg-brand-teal text-white shadow-lg scale-105'
                                    : 'bg-brand-teal/10 text-brand-teal border border-brand-teal/30 hover:bg-brand-teal/20'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Week Start Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hoặc chọn tuần cụ thể <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={weekStartDate}
                            onChange={(e) => setWeekStartDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full p-3 pl-11 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-brand-teal bg-white text-gray-900 font-medium transition-all hover:border-brand-teal/50 cursor-pointer"
                            style={{
                              colorScheme: 'light'
                            }}
                          />
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-teal pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Quick Weekday Patterns */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ⚡ Chọn nhanh mẫu
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            { label: '📅 Cả tuần', days: [1, 2, 3, 4, 5, 6, 0] },
                            { label: '💼 T2-T6', days: [1, 2, 3, 4, 5] },
                            { label: '🎉 Cuối tuần', days: [6, 0] },
                            { label: '⚡ T2,T4,T6', days: [1, 3, 5] }
                          ].map(({ label, days }) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setSelectedWeekDays(days)}
                              className="p-2 rounded-lg text-xs font-semibold bg-brand-teal/10 text-brand-teal border border-brand-teal/30 hover:bg-brand-teal/20 transition-all"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Day Selector */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chọn các ngày trong tuần <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-7 gap-2">
                          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, index) => {
                            // Tính ngày cụ thể cho mỗi thứ
                            let dateInfo = '';
                            if (weekStartDate) {
                              const startDate = new Date(weekStartDate);
                              const dayOfWeek = startDate.getDay();
                              const firstDayOfWeek = new Date(startDate);
                              firstDayOfWeek.setDate(startDate.getDate() - dayOfWeek);
                              
                              const targetDate = new Date(firstDayOfWeek);
                              targetDate.setDate(firstDayOfWeek.getDate() + index);
                              
                              const dayNum = targetDate.getDate();
                              const monthNum = targetDate.getMonth() + 1;
                              dateInfo = `${dayNum}/${monthNum}`;
                            }
                            
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleToggleWeekDay(index)}
                                disabled={!weekStartDate}
                                className={`p-3 rounded-lg font-medium text-sm transition-all ${
                                  selectedWeekDays.includes(index)
                                    ? 'bg-brand-teal text-white shadow-lg scale-105'
                                    : weekStartDate
                                    ? 'bg-white text-gray-700 border border-gray-300 hover:border-brand-teal/50 hover:bg-brand-teal/10'
                                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                }`}
                              >
                                <div className="flex flex-col items-center">
                                  <span className="font-bold">{day}</span>
                                  {dateInfo && (
                                    <span className={`text-xs mt-1 ${
                                      selectedWeekDays.includes(index) ? 'text-white/80' : 'text-gray-500'
                                    }`}>
                                      {dateInfo}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {!weekStartDate && (
                          <p className="mt-2 text-sm text-amber-600">
                            ⚠️ Vui lòng chọn tuần trước
                          </p>
                        )}
                        {selectedWeekDays.length > 0 && weekStartDate && (
                          <p className="mt-2 text-sm text-brand-teal font-medium">
                            ✓ Đã chọn {selectedWeekDays.length} ngày: {selectedWeekDays.map(d => {
                              const startDate = new Date(weekStartDate);
                              const dayOfWeek = startDate.getDay();
                              const firstDayOfWeek = new Date(startDate);
                              firstDayOfWeek.setDate(startDate.getDate() - dayOfWeek);
                              const targetDate = new Date(firstDayOfWeek);
                              targetDate.setDate(firstDayOfWeek.getDate() + d);
                              return `${['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d]} (${targetDate.getDate()}/${targetDate.getMonth() + 1})`;
                            }).join(', ')}
                          </p>
                        )}
                      </div>
                      
                      {/* Time Selector for Week */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chọn giờ chung <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="time"
                            value={weekTime}
                            onChange={(e) => setWeekTime(e.target.value)}
                            className="w-full p-3 pl-11 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-brand-teal bg-white text-gray-900 font-medium transition-all hover:border-brand-teal/50 cursor-pointer"
                            style={{
                              colorScheme: 'light'
                            }}
                          />
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-teal pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        
                        {/* Quick Time Selection */}
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            ⚡ Chọn nhanh
                          </label>
                          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                            {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map(time => {
                              const isSelected = weekTime === time;
                              return (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => setWeekTime(time)}
                                  className={`p-1.5 rounded-md text-xs font-semibold transition-all ${
                                    isSelected
                                      ? 'bg-brand-teal text-white shadow-md'
                                      : 'bg-brand-teal/10 text-brand-teal border border-brand-teal/30 hover:bg-brand-teal/20'
                                  }`}
                                >
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleAddWeekDays}
                        disabled={!weekStartDate || selectedWeekDays.length === 0}
                        className="w-full px-6 py-3 bg-gradient-to-r from-brand-navy to-brand-teal text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {selectedWeekDays.length > 0 ? `Thêm ${selectedWeekDays.length} mốc thời gian` : 'Thêm mốc thời gian'}
                      </button>
                    </div>
                  )}
                  
                  {timeSelectionMode === 'monthly' && (
                    /* Monthly Recurring Selection */
                    <div className="space-y-6">
                      {/* Date Range */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ngày bắt đầu <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              value={monthlyStartDate}
                              onChange={(e) => setMonthlyStartDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full p-3 pl-11 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-brand-teal bg-white text-gray-900 font-medium transition-all hover:border-brand-teal/50 cursor-pointer"
                              style={{
                                colorScheme: 'light'
                              }}
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-teal pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ngày kết thúc <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              value={monthlyEndDate}
                              onChange={(e) => setMonthlyEndDate(e.target.value)}
                              min={monthlyStartDate || new Date().toISOString().split('T')[0]}
                              className="w-full p-3 pl-11 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-brand-teal bg-white text-gray-900 font-medium transition-all hover:border-brand-teal/50 cursor-pointer"
                              style={{
                                colorScheme: 'light'
                              }}
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-teal pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Recurring Type Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Kiểu lặp lại <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setMonthlyRecurringType('dates')}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              monthlyRecurringType === 'dates'
                                ? 'border-brand-teal bg-brand-teal/10 text-brand-teal'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-brand-teal/30'
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-2xl mb-1">📅</div>
                              <div className="font-semibold">Theo ngày</div>
                              <div className="text-xs mt-1 opacity-75">VD: Mỗi ngày 1, 15</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMonthlyRecurringType('weekday')}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              monthlyRecurringType === 'weekday'
                                ? 'border-brand-teal bg-brand-teal/10 text-brand-teal'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-brand-teal/30'
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-2xl mb-1">📆</div>
                              <div className="font-semibold">Theo thứ</div>
                              <div className="text-xs mt-1 opacity-75">VD: T2 tuần đầu</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Days Selection (for dates type) */}
                      {monthlyRecurringType === 'dates' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chọn các ngày trong tháng <span className="text-red-500">*</span>
                          </label>
                          
                          {/* Quick Date Patterns */}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              ⚡ Chọn nhanh mẫu
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {[
                                { label: '📅 Đầu tháng', days: [1, 2, 3] },
                                { label: '🌙 Giữa tháng', days: [15, 16, 17] },
                                { label: '💰 Ngày lương', days: [1, 15] },
                                { label: '⚡ Tuần 1x', days: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19] }
                              ].map(({ label, days }) => (
                                <button
                                  key={label}
                                  type="button"
                                  onClick={() => setSelectedMonthDays(days)}
                                  className="p-2 rounded-lg text-xs font-semibold bg-brand-teal/10 text-brand-teal border border-brand-teal/30 hover:bg-brand-teal/20 transition-all"
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                              <button
                                key={day}
                                type="button"
                                onClick={() => handleToggleMonthDay(day)}
                                className={`p-2 rounded-lg font-medium text-sm transition-all ${
                                  selectedMonthDays.includes(day)
                                    ? 'bg-brand-teal text-white shadow-lg scale-105'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:border-brand-teal/50 hover:bg-brand-teal/10'
                                }`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                          {selectedMonthDays.length > 0 && (
                            <p className="mt-2 text-sm text-brand-teal font-medium">
                              ✓ Đã chọn {selectedMonthDays.length} ngày: {selectedMonthDays.join(', ')}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Weekday Selection (for weekday type) */}
                      {monthlyRecurringType === 'weekday' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Chọn thứ <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-7 gap-2">
                              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => setSelectedMonthWeekday(index + 1)}
                                  className={`p-3 rounded-lg font-medium text-sm transition-all ${
                                    selectedMonthWeekday === index + 1
                                      ? 'bg-brand-teal text-white shadow-lg scale-105'
                                      : 'bg-white text-gray-700 border border-gray-300 hover:border-brand-teal/50 hover:bg-brand-teal/10'
                                  }`}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tuần thứ mấy trong tháng <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                              {['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Cuối tháng'].map((week, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => setSelectedWeekOfMonth(index + 1)}
                                  className={`p-3 rounded-lg font-medium text-sm transition-all ${
                                    selectedWeekOfMonth === index + 1
                                      ? 'bg-brand-teal text-white shadow-lg'
                                      : 'bg-white text-gray-700 border border-gray-300 hover:border-brand-teal/50 hover:bg-brand-teal/10'
                                  }`}
                                >
                                  {week}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Time Selector */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chọn giờ <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="time"
                            value={monthlyTime}
                            onChange={(e) => setMonthlyTime(e.target.value)}
                            className="w-full p-3 pl-11 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-brand-teal bg-white text-gray-900 font-medium transition-all hover:border-brand-teal/50 cursor-pointer"
                            style={{
                              colorScheme: 'light'
                            }}
                          />
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-teal pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        
                        {/* Quick Time Selection */}
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            ⚡ Chọn nhanh
                          </label>
                          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                            {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map(time => {
                              const isSelected = monthlyTime === time;
                              return (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => setMonthlyTime(time)}
                                  className={`p-1.5 rounded-md text-xs font-semibold transition-all ${
                                    isSelected
                                      ? 'bg-brand-teal text-white shadow-md'
                                      : 'bg-brand-teal/10 text-brand-teal border border-brand-teal/30 hover:bg-brand-teal/20'
                                  }`}
                                >
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Add Button */}
                      <button
                        type="button"
                        onClick={handleAddMonthlyRecurring}
                        disabled={
                          !monthlyStartDate || 
                          !monthlyEndDate || 
                          (monthlyRecurringType === 'dates' && selectedMonthDays.length === 0)
                        }
                        className="w-full px-6 py-3 bg-gradient-to-r from-brand-navy to-brand-teal text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tạo lịch định kỳ
                      </button>

                      {/* Info Box */}
                      <div className="bg-brand-teal/5 border border-brand-teal/20 rounded-lg p-4">
                        <p className="text-sm text-brand-navy">
                          💡 <strong>Lưu ý:</strong> Hệ thống sẽ tự động tạo các mốc thời gian theo chu kỳ bạn chọn trong khoảng thời gian đã chỉ định.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Danh sách các mốc thời gian đã chọn */}
              {bookingData.bookingTimes.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-300">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Các mốc thời gian đã chọn ({bookingData.bookingTimes.length})
                  </h4>
                  
                  <div className="space-y-3">
                    {bookingData.bookingTimes.map((time) => (
                      <div key={time} className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <svg className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium text-gray-900">{formatBookingTime(time)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {/* Duplicate buttons */}
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleDuplicateTime(time, 7)}
                                className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium border border-blue-200"
                                title="Sao chép sang tuần sau"
                              >
                                +7 ngày
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateTime(time, 1)}
                                className="px-2 py-1 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-xs font-medium border border-purple-200"
                                title="Sao chép sang ngày mai"
                              >
                                +1 ngày
                              </button>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleRemoveBookingTime(time)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa mốc thời gian này"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-lg">
                    <p className="text-sm text-green-800 flex items-start">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        Hệ thống sẽ tạo <strong className="mx-1 text-lg">{bookingData.bookingTimes.length} booking riêng biệt</strong> với cùng thông tin dịch vụ và địa chỉ. 
                        Mỗi booking sẽ có mã đơn hàng và thanh toán riêng.
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Duration and Notes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Thời lượng dự kiến <span className="text-red-500">*</span>
                  </h5>
                  
                  {/* Duration Selection Type */}
                  <div className="mb-4">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDurationInputType('preset');
                          setCustomDuration('');
                          if (bookingData.duration) {
                            // Keep current duration if it's one of the presets
                            const presets = [60, 90, 120, 180, 240];
                            if (!presets.includes(bookingData.duration)) {
                              setBookingData(prev => ({ ...prev, duration: null }));
                            }
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          durationInputType === 'preset'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Chọn sẵn
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDurationInputType('custom');
                          setBookingData(prev => ({ ...prev, duration: null }));
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          durationInputType === 'custom'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Tự nhập
                      </button>
                    </div>
                  </div>

                  {durationInputType === 'preset' ? (
                    <select
                      name="duration"
                      value={bookingData.duration || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : null;
                        setBookingData(prev => ({ ...prev, duration: value }));
                      }}
                      className={`w-full p-3 border rounded-lg transition-all bg-white ${
                        !bookingData.duration 
                          ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                      }`}
                    >
                      <option value="">Chọn thời lượng</option>
                      <option value={60}>60 phút (1 giờ)</option>
                      <option value={90}>90 phút (1.5 giờ)</option>
                      <option value={120}>120 phút (2 giờ)</option>
                      <option value={180}>180 phút (3 giờ)</option>
                      <option value={240}>240 phút (4 giờ)</option>
                      <option value={300}>300 phút (5 giờ)</option>
                      <option value={360}>360 phút (6 giờ)</option>
                    </select>
                  ) : (
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={customDuration}
                        onChange={(e) => {
                          setCustomDuration(e.target.value);
                          const value = parseInt(e.target.value);
                          if (value > 0) {
                            setBookingData(prev => ({ ...prev, duration: value }));
                          } else {
                            setBookingData(prev => ({ ...prev, duration: null }));
                          }
                        }}
                        placeholder="Nhập số phút"
                        min="30"
                        max="480"
                        className={`flex-1 p-3 border rounded-lg transition-all ${
                          !bookingData.duration 
                            ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                        }`}
                      />
                      <span className="flex items-center px-3 text-gray-500 bg-gray-100 border border-gray-300 rounded-lg">
                        phút
                      </span>
                    </div>
                  )}
                  
                  {!bookingData.duration && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Vui lòng chọn thời lượng dự kiến
                    </p>
                  )}
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
                  <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                    </svg>
                    Ghi chú đặc biệt
                  </h5>
                  <textarea
                    name="notes"
                    value={bookingData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                    placeholder="Ví dụ: Nhà có thú cưng, cần mang dụng cụ đặc biệt, lưu ý về cửa ra vào..."
                  />
                  <p className="mt-2 text-sm text-orange-600">
                    ✏️ Thông tin này giúp nhân viên chuẩn bị tốt hơn
                  </p>
                </div>
              </div>

              {/* Employee Selection Section */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                  <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Phương thức đặt lịch
                </h4>

                {/* Option Selection: Choose between Employee or Post */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Option 1: Chọn nhân viên */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmployeeSelection(true);
                      setPostTitle('');
                      setPostImageFiles([]); // Reset image files
                    }}
                    className={`p-5 rounded-xl border-2 transition-all duration-200 ${
                      showEmployeeSelection
                        ? 'border-cyan-500 bg-cyan-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-cyan-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                        showEmployeeSelection ? 'border-cyan-500' : 'border-gray-300'
                      }`}>
                        {showEmployeeSelection && (
                          <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                        )}
                      </div>
                      <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <h5 className="ml-2 font-semibold text-gray-900">Chọn nhân viên</h5>
                    </div>
                    <p className="text-sm text-gray-600 text-left">
                      Đặt lịch trực tiếp với nhân viên phù hợp
                    </p>
                  </button>

                  {/* Option 2: Tạo bài đăng */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmployeeSelection(false);
                      setSelectedEmployees([]);
                    }}
                    className={`p-5 rounded-xl border-2 transition-all duration-200 ${
                      !showEmployeeSelection
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                        !showEmployeeSelection ? 'border-indigo-500' : 'border-gray-300'
                      }`}>
                        {!showEmployeeSelection && (
                          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                        )}
                      </div>
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <h5 className="ml-2 font-semibold text-gray-900">Tạo bài đăng</h5>
                    </div>
                    <p className="text-sm text-gray-600 text-left">
                      Đăng tìm nhân viên (cần admin xác minh)
                    </p>
                  </button>
                </div>

                {/* Hiển thị form tạo bài đăng */}
                {!showEmployeeSelection && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-indigo-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3 flex-1">
                          <h4 className="text-indigo-800 font-medium text-sm mb-1">Thông tin bài đăng</h4>
                          <p className="text-indigo-700 text-sm">
                            Bài đăng của bạn sẽ cần được admin xác minh trước khi hiển thị công khai để nhân viên có thể nhận việc.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Form nhập title và imageUrl cho booking post - LUÔN HIỂN THỊ */}
                    <div className="bg-white border border-indigo-200 rounded-lg p-5 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Tiêu đề bài đăng
                          <span className="text-gray-400 font-normal ml-1">(Tùy chọn, tối đa 255 ký tự)</span>
                        </label>
                        <input
                          type="text"
                          value={postTitle}
                          onChange={(e) => setPostTitle(e.target.value.slice(0, 255))}
                          maxLength={255}
                          placeholder="VD: Cần nhân viên dọn dẹp nhà cấp tốc"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {postTitle.length}/255 ký tự
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Hình ảnh bài đăng
                          <span className="text-gray-400 font-normal ml-1">(Tùy chọn, tối đa 10 ảnh)</span>
                        </label>
                        <MultipleImageUpload
                          onImagesChanged={(files) => setPostImageFiles(files)}
                          currentImages={postImageFiles}
                          maxImages={10}
                          className="w-full"
                        />
                      </div>

                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                        <p className="text-xs text-indigo-700">
                          💡 <strong>Mẹo:</strong> Thêm tiêu đề và hình ảnh sẽ giúp bài đăng của bạn thu hút nhân viên phù hợp hơn!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hiển thị form chọn nhân viên */}
                {showEmployeeSelection && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg p-4 border border-cyan-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 pr-4">
                          <p className="text-gray-700 text-sm leading-relaxed">
                            Chọn nhân viên cụ thể để đặt lịch ngay, hoặc để trống để tạo bài đăng tìm nhân viên.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleLoadSuitableEmployees}
                          className="flex items-center px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50"
                        >
                          <User className="w-4 h-4 mr-2" />
                          <span className="whitespace-nowrap">Tìm nhân viên</span>
                        </button>
                      </div>
                    </div>

                    {/* Local Error Messages for Employee Selection */}
                    {employeeSelectionErrors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                          </div>
                          <div className="ml-3 flex-1">
                            <h4 className="text-red-800 font-medium text-sm mb-1">Thông tin chưa đầy đủ</h4>
                            <div className="space-y-1">
                              {employeeSelectionErrors.map((message, index) => (
                                <p key={index} className="text-red-700 text-sm">{message}</p>
                              ))}
                            </div>
                          </div>
                          <button 
                            onClick={() => setEmployeeSelectionErrors([])} 
                            className="flex-shrink-0 ml-3 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {employeesData && employeesData.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {employeesData.map((employee: SuitableEmployee) => (
                          <div
                            key={employee.employeeId}
                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 ${
                              selectedEmployees.includes(employee.employeeId)
                                ? 'border-blue-500 bg-blue-50 shadow-blue-100'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                            onClick={() => {
                              setSelectedEmployees(prev => {
                                if (prev.includes(employee.employeeId)) {
                                  return prev.filter(id => id !== employee.employeeId);
                                } else {
                                  return [employee.employeeId];
                                }
                              });
                            }}
                          >
                            <div className="flex items-start">
                              <div className="w-12 h-12 rounded-full overflow-hidden mr-3 flex-shrink-0">
                                {employee.avatar ? (
                                  <img src={employee.avatar} alt={employee.fullName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                    <User className="w-6 h-6 text-gray-600" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-semibold text-gray-900 truncate">{employee.fullName}</h5>
                                  {selectedEmployees.includes(employee.employeeId) && (
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">TP. Hồ Chí Minh</p>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center">
                                    <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="text-sm text-gray-700">{employee.rating || 'Mới'}</span>
                                  </div>
                                  <span className="text-sm text-green-600 font-medium">{employee.totalCompletedJobs || 0} việc</span>
                                </div>
                                {employee.primarySkills && employee.primarySkills.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {employee.primarySkills.slice(0, 2).map((skill: string, index: number) => (
                                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        {skill}
                                      </span>
                                    ))}
                                    {employee.primarySkills.length > 2 && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                        +{employee.primarySkills.length - 2}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {employeesData && employeesData.length === 0 && (
                      <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h6 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy nhân viên phù hợp</h6>
                        <p className="text-gray-600 mb-1">Hiện tại không có nhân viên có sẵn trong khung thời gian này</p>
                        <p className="text-sm text-blue-600">Hệ thống sẽ tự động phân công nhân viên phù hợp khi có sẵn</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Xác nhận đặt lịch</h3>
              <p className="text-gray-600">Kiểm tra lại thông tin và hoàn tất việc đặt lịch dịch vụ</p>
            </div>
            
            {/* Order Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Thông tin đơn hàng
              </h4>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Dịch vụ</p>
                        <p className="text-gray-900 font-semibold">{selectedService?.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 mb-2">Các mốc thời gian đã chọn</p>
                        <div className="space-y-2">
                          {bookingData.bookingTimes.map((time, index) => (
                            <div key={index} className="flex items-center text-gray-900 font-semibold bg-blue-50 px-3 py-2 rounded-lg">
                              <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatBookingTime(time)}
                            </div>
                          ))}
                        </div>
                        {bookingData.bookingTimes.length > 1 && (
                          <p className="text-xs text-gray-500 mt-2">
                            Tổng cộng {bookingData.bookingTimes.length} booking sẽ được tạo
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Địa chỉ</p>
                        <p className="text-gray-900 font-semibold text-sm leading-relaxed">
                          {addressSource === 'current' ? currentLocationAddress :
                           addressSource === 'custom' ? customAddress :
                           bookingData.address}
                        </p>
                      </div>
                    </div>
                    
                    {/* Show booking post title if no employee selected */}
                    {selectedEmployees.length === 0 && postTitle && (
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500">Tiêu đề bài đăng</p>
                          <p className="text-gray-900 font-semibold text-sm mt-1 p-3 bg-purple-50 rounded-lg border border-purple-200">
                            {postTitle}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Show booking post image if no employee selected and image exists */}
                    {selectedEmployees.length === 0 && postImageFiles.length > 0 && (
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 mb-2">
                            Hình ảnh tham khảo ({postImageFiles.length} ảnh)
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {postImageFiles.map((file, index) => (
                              <div key={index} className="rounded-lg overflow-hidden border border-indigo-200 shadow-sm">
                                <img 
                                  src={URL.createObjectURL(file)} 
                                  alt={`Booking reference ${index + 1}`} 
                                  className="w-full h-32 object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {bookingData.notes && (
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Ghi chú</p>
                          <p className="text-gray-900 font-medium text-sm">{bookingData.notes}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedEmployees.length > 0 && employeesData && (
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Nhân viên được chọn</p>
                          <div className="space-y-3 mt-2">
                            {employeesData
                              .filter(emp => selectedEmployees.includes(emp.employeeId))
                              .map(employee => (
                                <div key={employee.employeeId} className="p-3 border border-blue-300 rounded-xl bg-blue-50">
                                  <div className="flex items-start">
                                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                                      {employee.avatar ? (
                                        <img src={employee.avatar} alt={employee.fullName} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                          <User className="w-5 h-5 text-gray-600" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between mb-1">
                                        <h6 className="font-semibold text-gray-900 text-sm">{employee.fullName}</h6>
                                        <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                                      </div>
                                      <p className="text-xs text-gray-600 mb-2">TP. Hồ Chí Minh</p>
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                          <svg className="w-3 h-3 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                          <span className="text-xs text-gray-700">{employee.rating || 'Mới'}</span>
                                        </div>
                                        <span className="text-xs text-green-600 font-medium">{employee.totalCompletedJobs || 0} việc</span>
                                      </div>
                                      {employee.primarySkills && employee.primarySkills.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {employee.primarySkills.slice(0, 2).map((skill: string, index: number) => (
                                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                              {skill}
                                            </span>
                                          ))}
                                          {employee.primarySkills.length > 2 && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                              +{employee.primarySkills.length - 2}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show auto assignment message when no employee selected */}
                    {selectedEmployees.length === 0 && (
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phân công nhân viên</p>
                          <p className="text-gray-700 font-medium text-sm">Hệ thống sẽ tự động phân công nhân viên phù hợp nhất</p>
                          <p className="text-xs text-gray-500 mt-1">Dựa trên vị trí, kỹ năng và đánh giá</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Tổng chi phí:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {(priceData?.finalPrice || estimatedPrice).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    * Giá cuối cùng có thể thay đổi tùy thuộc vào thực tế công việc
                  </p>
                </div>
              </div>
            </div>

            {/* Promo Code */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Mã khuyến mãi
                </h4>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPromoCodeInput}
                    onChange={(e) => {
                      setShowPromoCodeInput(e.target.checked);
                      // Clear promo code if unchecking
                      if (!e.target.checked) {
                        setBookingData(prev => ({ ...prev, promoCode: '' }));
                      }
                    }}
                    className="sr-only"
                  />
                  <div className={`relative w-11 h-6 transition-colors duration-200 ease-in-out rounded-full ${showPromoCodeInput ? 'bg-amber-600' : 'bg-gray-300'}`}>
                    <div className={`inline-block w-4 h-4 transition-transform duration-200 ease-in-out transform bg-white rounded-full top-1 left-1 absolute ${showPromoCodeInput ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {showPromoCodeInput ? 'Đã kích hoạt' : 'Có mã khuyến mãi'}
                  </span>
                </label>
              </div>
              
              {showPromoCodeInput && (
                <div className="bg-white rounded-lg p-4 border border-amber-100">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={bookingData.promoCode || ''}
                      onChange={(e) => setBookingData(prev => ({ ...prev, promoCode: e.target.value }))}
                      placeholder="Nhập mã khuyến mãi (nếu có)"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        // TODO: Apply promo code logic
                        console.log('Applying promo code:', bookingData.promoCode);
                      }}
                      className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-sm"
                    >
                      Áp dụng
                    </button>
                  </div>
                  <p className="text-sm text-amber-600 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mã khuyến mãi sẽ được áp dụng vào tổng tiền cuối cùng
                  </p>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                Phương thức thanh toán
              </h4>
              <div className="space-y-3">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <label
                      key={method.methodId}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                        bookingData.paymentMethod === method.methodId.toString()
                          ? 'border-green-500 bg-green-50 shadow-green-100'
                          : 'border-gray-200 bg-white hover:border-green-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.methodId.toString()}
                        checked={bookingData.paymentMethod === method.methodId.toString()}
                        onChange={handleInputChange}
                        className="mr-4 text-green-600 focus:ring-green-500"
                      />
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                        bookingData.paymentMethod === method.methodId.toString()
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                      }`}>
                        <CreditCard className={`w-5 h-5 ${
                          bookingData.paymentMethod === method.methodId.toString()
                            ? 'text-green-600'
                            : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{method.methodName}</div>
                        <div className="text-sm text-gray-600">{method.methodCode}</div>
                      </div>
                      {bookingData.paymentMethod === method.methodId.toString() && (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      )}
                    </label>
                  ))
                ) : (
                  <div className="p-6 bg-white rounded-lg text-center border-2 border-dashed border-gray-200">
                    <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-500">Đang tải phương thức thanh toán...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Điều khoản và điều kiện
              </h5>
              <div className="text-sm text-gray-600 space-y-2">
                <p>✓ Bạn xác nhận rằng tất cả thông tin đã cung cấp là chính xác</p>
                <p>✓ Dịch vụ sẽ được thực hiện theo đúng thời gian đã đặt</p>
                <p>✓ Phí hủy đặt lịch có thể áp dụng nếu hủy trong vòng 24 giờ trước khi thực hiện</p>
                <p>✓ Giá cuối cùng có thể thay đổi tùy thuộc vào tình hình thực tế</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      role="CUSTOMER"
      title="Đặt lịch dịch vụ"
      description="Hoàn thành các bước sau để đặt lịch dịch vụ của bạn"
    >
      <div className="space-y-6">
        {/* Error Messages */}
        {errorMessages.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-red-800 font-medium mb-1">Vui lòng kiểm tra lại thông tin</h3>
                <div className="space-y-1">
                  {errorMessages.map((message, index) => (
                    <p key={index} className="text-red-700 text-sm">{message}</p>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => setErrorMessages([])} 
                className="flex-shrink-0 ml-3 text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        
        {/* Enhanced Progress Bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-200">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
            </div>
            
            {/* Step Items */}
            {[
              { num: 1, title: 'Dịch vụ', subtitle: 'Chọn dịch vụ cần thiết' },
              { num: 2, title: 'Địa điểm', subtitle: 'Xác định vị trí thực hiện' },
              { num: 3, title: 'Thời gian', subtitle: 'Lên lịch phù hợp' },
              { num: 4, title: 'Xác nhận', subtitle: 'Hoàn tất đặt lịch' }
            ].map((stepItem) => (
              <div key={stepItem.num} className="flex flex-col items-center relative z-10">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    step >= stepItem.num
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-500 text-white shadow-lg'
                      : step === stepItem.num - 1
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {step > stepItem.num ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{stepItem.num}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${
                    step >= stepItem.num ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {stepItem.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 max-w-20">
                    {stepItem.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8">
            {renderStepContent()}
          </div>
          
          {/* Action Buttons */}
          <div className="bg-gray-50 px-6 py-4 sm:px-8 sm:py-6 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrev}
                disabled={step === 1}
                className="flex items-center px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại
              </button>
              
              <div className="text-sm text-gray-500 hidden sm:block">
                Bước {step} / 4
              </div>
              
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !bookingData.serviceId) ||
                    (step === 2 && (
                      (addressSource === 'custom' && (
                        isManualAddress 
                          ? !manualAddress.trim()
                          : (!selectedProvinceCode || !selectedCommuneCode || !streetAddress.trim())
                      )) ||
                      (addressSource === 'current' && !currentLocationAddress) ||
                      (addressSource === 'profile' && (!user?.customerId))
                    )) ||
                    (step === 3 && (
                      bookingData.bookingTimes.length === 0 || 
                      !bookingData.duration ||
                      bookingData.duration <= 0
                    ))
                  }
                  className="flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
                >
                  {step === 3 && bookingData.bookingTimes.length === 0
                    ? 'Vui lòng thêm ít nhất một mốc thời gian' 
                    : 'Tiếp tục'
                  }
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={bookingLoading}
                  className="flex items-center px-8 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Xác nhận đặt lịch
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BookingPage;
