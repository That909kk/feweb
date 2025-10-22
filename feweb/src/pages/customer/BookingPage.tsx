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
import DashboardLayout from '../../layouts/DashboardLayout';
import type { 
  CreateBookingRequest,
  SuitableEmployee,
  BookingValidationRequest,
  PaymentMethod
} from '../../types/api';

// Helper function for input validation
const validateBookingForm = (
  formData: {
    serviceId: string;
    address: string;
    date: string;
    time: string;
  }
): string[] => {
  const errors: string[] = [];
  
  if (!formData.serviceId) errors.push('Vui lòng chọn dịch vụ');
  if (!formData.address) errors.push('Vui lòng nhập địa chỉ');
  if (!formData.date) errors.push('Vui lòng chọn ngày đặt lịch');
  if (!formData.time) errors.push('Vui lòng chọn giờ đặt lịch');
  
  // Validate time format
  if (formData.time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.time)) {
    errors.push('Giờ đặt lịch không đúng định dạng (HH:MM)');
  }
  
  
  if (formData.date && formData.time) {
    const dateTime = new Date(`${formData.date}T${formData.time}`);
    // Booking should be at least 1 hour in the future
    const minBookingTime = new Date();
    minBookingTime.setHours(minBookingTime.getHours() + 1);
    
    if (dateTime <= minBookingTime) {
      errors.push('Thời gian đặt lịch phải cách hiện tại ít nhất 1 giờ');
    }
    
    // Booking should be within business hours (8:00-17:00)
    const hours = dateTime.getHours();
    if (hours < 8 || hours >= 17) {
      errors.push('Thời gian đặt lịch phải nằm trong giờ làm việc (8:00 - 17:00)');
    }
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
    validateBooking, 
    getPaymentMethods, 
    isLoading: bookingLoading, 
    error: bookingError 
  } = useBooking();
  const preselectedServiceId = searchParams.get('service');
  
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    serviceId: preselectedServiceId || '',
    address: '',
    date: '',
    time: '',
    duration: 120,
    notes: '',
    paymentMethod: '1', // Default to first payment method ID
    promoCode: ''
  });
  
  // Category selection state
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loadingCategoryServices, setLoadingCategoryServices] = useState<boolean>(false);
  
  // Error display state
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  
  const [addressSource, setAddressSource] = useState<'profile' | 'current' | 'custom'>('profile');
  const [customAddress, setCustomAddress] = useState('');
  const [currentLocationAddress, setCurrentLocationAddress] = useState('');
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [customTimeInput, setCustomTimeInput] = useState('');
  const [timeInputType, setTimeInputType] = useState<'preset' | 'custom'>('preset');
  const [quickDateOptions, setQuickDateOptions] = useState<Array<{date: string, label: string, dayOfWeek: string}>>([]);
  
  // State cho bản đồ
  const [mapCoordinates, setMapCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  // State cho payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // State for booking flow
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<number[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Array<{choiceId: number, choiceName: string}>>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showEmployeeSelection, setShowEmployeeSelection] = useState<boolean>(false);
  const [suggestedStaff, setSuggestedStaff] = useState<number>(1);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(0);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [showMap, setShowMap] = useState<boolean>(false);
  
  // Thêm state cho các trường địa chỉ chi tiết
  const [addressDetails, setAddressDetails] = useState({
    street: '',         // Tên đường
    houseNumber: '',    // Số nhà
    alley: '',          // Hẻm/ngõ
    ward: '',           // Phường/xã
    district: '',       // Quận/huyện
    city: ''            // Thành phố
  });
  
  // Tạo các tùy chọn ngày nhanh (hôm nay, ngày mai, ngày kia...)
  useEffect(() => {
    const today = new Date();
    const options: Array<{date: string, label: string, dayOfWeek: string}> = [];
    
    // Tạo 7 ngày kể từ hôm nay
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0];
      let label = '';
      
      if (i === 0) label = 'Hôm nay';
      else if (i === 1) label = 'Ngày mai';
      else if (i === 2) label = 'Ngày kia';
      else label = `${date.getDate()}/${date.getMonth() + 1}`;
      
      const dayOfWeekNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dayOfWeek = dayOfWeekNames[date.getDay()];
      
      options.push({ date: dateStr, label, dayOfWeek });
    }
    
    setQuickDateOptions(options);
  }, []);

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
  
  // Hàm chọn ngày nhanh
  const handleQuickDateSelect = (date: string) => {
    setBookingData(prev => ({ ...prev, date }));
  };
  
  // Lấy địa chỉ từ profile người dùng khi component mount
  useEffect(() => {
    if (user?.profileData && 'address' in user.profileData && user.profileData.address) {
      setBookingData(prev => ({
        ...prev,
        address: (user.profileData as any).address
      }));
    }
  }, [user]);

  // Auto calculate price when service or options change
  useEffect(() => {
    if (bookingData.serviceId && selectedChoiceIds.length >= 0) {
      handlePriceCalculation();
    }
  }, [bookingData.serviceId, selectedChoiceIds]);

  // Update local price state when calculation completes
  useEffect(() => {
    if (priceData) {
      setCurrentPrice(priceData.finalPrice);
      setSuggestedStaff(priceData.suggestedStaff);
      setEstimatedDuration(priceData.estimatedDurationHours);
    }
  }, [priceData]);

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
              setLocationAccuracy(bestPosition.coords.accuracy);
              setBookingData(prev => ({ ...prev, address: formattedAddress }));
              setAddressSource('current');
              
              // Tự động hiển thị bản đồ sau khi lấy được vị trí
              setShowMap(true);
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
                  setLocationAccuracy(bestPosition.coords.accuracy);
                  setBookingData(prev => ({ ...prev, address: formattedAddress }));
                  setAddressSource('current');
                  setShowMap(true);
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
        ward: addressDetails.ward || addressDetails.quarter || addressDetails.village || addressDetails.hamlet || '',
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
      
      return formattedAddress;
    } catch (error) {
      console.error('Lỗi khi lấy địa chỉ:', error);
      return null;
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Hàm chọn nguồn địa chỉ
  const handleAddressSourceChange = (source: 'profile' | 'current' | 'custom') => {
    console.log(`🏠 [ADDRESS] Switching address source to: ${source}`);
    setAddressSource(source);
    
    // Clear previous address data when switching source
    if (source === 'custom') {
      setCustomAddress('');
      setCurrentLocationAddress('');
      setMapCoordinates(null);
    } else if (source === 'current') {
      setCustomAddress('');
      setCurrentLocationAddress('');
      // Tự động lấy vị trí hiện tại và hiển thị bản đồ
      getCurrentLocation();
    } else if (source === 'profile') {
      setCustomAddress('');
      setCurrentLocationAddress('');
      setMapCoordinates(null);
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
  
  // Hàm tạo địa chỉ đầy đủ từ dữ liệu được truyền vào
  const generateFullAddressFromDetails = (details: typeof addressDetails): string => {
    const { houseNumber, alley, street, ward, city } = details;
    let parts = [];
    
    if (houseNumber) parts.push(`Số ${houseNumber}`);
    if (alley) parts.push(`Hẻm ${alley}`);
    if (street) parts.push(`Đường ${street}`);
    if (ward) parts.push(`Phường ${ward}`);
    if (city) parts.push(city);
    
    return parts.join(', ');
  };

  // Hàm xử lý nhập thời gian tùy chỉnh
  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomTimeInput(value);
    
    // Cập nhật bookingData khi nhập thời gian tùy chỉnh
    if (timeInputType === 'custom') {
      setBookingData(prev => ({ ...prev, time: value }));
    }
  };

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

  // Hàm kiểm tra thời gian có phải là quá khứ không
  const isTimeInPast = (time: string): boolean => {
    if (!bookingData.date) return false;
    
    const today = new Date().toISOString().split('T')[0];
    if (bookingData.date > today) return false; // Nếu không phải hôm nay, không cần kiểm tra
    
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const selectedTime = new Date();
    selectedTime.setHours(hours, minutes, 0, 0);
    
    return selectedTime <= now;
  };

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
    setSelectedOptions([]);
    setSelectedChoiceIds([]);
    clearServiceOptions();
    clearPriceData();
    
    if (serviceId) {
      await loadServiceOptions(parseInt(serviceId));
    }
  };

  // Handle option selection
  const handleOptionSelect = (choiceId: number, choiceName: string, isMultiple: boolean = false) => {
    if (isMultiple) {
      // For multiple choice options
      setSelectedOptions(prev => {
        const exists = prev.find(opt => opt.choiceId === choiceId);
        if (exists) {
          return prev.filter(opt => opt.choiceId !== choiceId);
        } else {
          return [...prev, { choiceId, choiceName }];
        }
      });
      
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
      setSelectedOptions([{ choiceId, choiceName }]);
      setSelectedChoiceIds([choiceId]);
    }
  };

  // Calculate price when options change
  const handlePriceCalculation = async () => {
    if (bookingData.serviceId && selectedChoiceIds.length >= 0) {
      await calculateServicePrice({
        serviceId: parseInt(bookingData.serviceId),
        selectedChoiceIds: selectedChoiceIds,
        quantity: 1
      });
    }
  };

  // Load suitable employees
  const handleLoadSuitableEmployees = async () => {
    if (bookingData.serviceId && bookingData.date && bookingData.time) {
      const bookingDateTime = `${bookingData.date}T${bookingData.time}:00`;
      
      await loadSuitableEmployees({
        serviceId: parseInt(bookingData.serviceId),
        bookingTime: bookingDateTime,
        district: 'Quận Tân Phú', // Default district
        city: 'TP. Hồ Chí Minh', // Default city
        latitude: mapCoordinates?.lat || 10.7769,
        longitude: mapCoordinates?.lng || 106.6601
      });
    }
  };

  // Validate booking before submission
  const handleBookingValidation = async (): Promise<boolean> => {
    if (!user?.customerId || !bookingData.serviceId) return false;

    try {
      // Handle address selection for validation
      let addressId: string | null = null;
      let newAddress: any = null;

      if (addressSource === 'profile') {
        const defaultAddress = await getDefaultAddress(user.customerId);
        if (!defaultAddress?.addressId) {
          setErrorMessages(['Không thể lấy địa chỉ mặc định']);
          return false;
        }
        addressId = defaultAddress.addressId;
      } else if (addressSource === 'current' || addressSource === 'custom') {
        const finalAddress = addressSource === 'current' ? currentLocationAddress : customAddress;
        const finalCoordinates = addressSource === 'current' ? mapCoordinates : null;
        
        if (!finalAddress) {
          setErrorMessages(['Vui lòng nhập địa chỉ']);
          return false;
        }

        newAddress = {
          customerId: user.customerId,
          fullAddress: finalAddress,
          ward: addressDetails.ward || 'Phường/Xã',
          district: addressDetails.district || 'Quận/Huyện', 
          city: addressDetails.city || 'TP. Hồ Chí Minh',
          latitude: finalCoordinates?.lat || null,
          longitude: finalCoordinates?.lng || null
        };
      }

      // Format date and time consistently (YYYY-MM-DDTHH:MM:SS format)
      const timeWithSeconds = bookingData.time.includes(':') && bookingData.time.split(':').length === 2
        ? `${bookingData.time}:00`
        : bookingData.time;
      const bookingTimeISO = `${bookingData.date}T${timeWithSeconds}`;
      
      const validationRequest: BookingValidationRequest = {
        addressId: addressId || undefined,
        newAddress: newAddress || undefined,
        bookingTime: bookingTimeISO,
        note: bookingData.notes || undefined,
        promoCode: bookingData.promoCode || null,
        bookingDetails: [{
          serviceId: parseInt(bookingData.serviceId),
          quantity: 1,
          expectedPrice: priceData?.finalPrice || (services.find(s => s.serviceId === parseInt(bookingData.serviceId))?.basePrice || 0),
          expectedPricePerUnit: priceData?.finalPrice || (services.find(s => s.serviceId === parseInt(bookingData.serviceId))?.basePrice || 0),
          selectedChoiceIds: selectedChoiceIds
        }],
        assignments: selectedEmployees.length > 0 ? selectedEmployees.map(employeeId => ({
          serviceId: parseInt(bookingData.serviceId),
          employeeId: employeeId
        })) : null, // Use null when no assignments (as per API spec)
        paymentMethodId: parseInt(bookingData.paymentMethod) || 1
      };

      console.log('🔍 [VALIDATION DEBUG] Sending validation request:', JSON.stringify(validationRequest, null, 2));
      
      const validationResult = await validateBooking(validationRequest);
      
      console.log('🔍 [VALIDATION DEBUG] Validation response:', JSON.stringify(validationResult, null, 2));
      
      // If validation API failed (returned null), skip validation and proceed
      if (validationResult === null) {
        console.log('⚠️ [VALIDATION] Validation API failed - skipping validation and proceeding with booking');
        return true; // Allow booking to proceed even if validation fails
      }
      
      if (validationResult?.valid) {
        console.log('✅ [VALIDATION] Booking validation passed');
        return true;
      } else {
        // Combine errors and conflicts into error messages
        const allErrors = [
          ...(validationResult?.errors || []),
          ...(validationResult?.conflicts?.map(c => c.reason) || [])
        ];
        console.log('❌ [VALIDATION] Booking validation failed:', {
          errors: validationResult?.errors || [],
          conflicts: validationResult?.conflicts || [],
          allErrors
        });
        setErrorMessages(allErrors.length > 0 ? allErrors : ['Đặt lịch không hợp lệ']);
        return false;
      }
    } catch (error) {
      console.error('Validation error:', error);
      setErrorMessages(['Lỗi khi kiểm tra thông tin đặt lịch']);
      return false;
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

      // Format date and time for API (YYYY-MM-DDTHH:MM:SS format)
      const timeWithSeconds = bookingData.time.includes(':') && bookingData.time.split(':').length === 2
        ? `${bookingData.time}:00`
        : bookingData.time;
        
      const bookingDateTime = `${bookingData.date}T${timeWithSeconds}`;

      // Ensure date is in the future
      const bookingDate = new Date(bookingDateTime);
      
      // Add 2 hours to current time to ensure booking meets API requirement (at least 2 hours from now)
      const minBookingTime = new Date();
      minBookingTime.setHours(minBookingTime.getHours() + 2);
      
      if (bookingDate <= minBookingTime) {
        setErrorMessages(['Thời gian đặt lịch phải cách hiện tại ít nhất 2 giờ theo quy định']);
        return;
      }

      // Validate booking before proceeding
      const isValidBooking = await handleBookingValidation();
      if (!isValidBooking) {
        return; // Error messages already set by validation
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
        try {
          console.log('🏠 [DEBUG] Getting default address for customer:', user.customerId);
          const defaultAddress = await getDefaultAddress(user.customerId);
          
          if (defaultAddress && defaultAddress.addressId) {
            addressId = defaultAddress.addressId;
            console.log('🏠 [SUCCESS] Got addressId from API:', addressId);
            console.log('🏠 [DEBUG] Full address details:', defaultAddress);
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
      } else if (addressSource === 'current' || addressSource === 'custom') {
        // Use new address (current location or custom input)
        const finalAddress = addressSource === 'current' ? currentLocationAddress : customAddress;
        const finalCoordinates = addressSource === 'current' ? mapCoordinates : null;
        
        if (!finalAddress) {
          setErrorMessages(['Vui lòng nhập địa chỉ']);
          return;
        }

        // Create newAddress object for API
        newAddress = {
          customerId: user.customerId,
          fullAddress: finalAddress,
          ward: addressDetails.ward || 'Phường/Xã',
          district: addressDetails.district || 'Quận/Huyện', 
          city: addressDetails.city || 'TP. Hồ Chí Minh',
          latitude: finalCoordinates?.lat || null,
          longitude: finalCoordinates?.lng || null
        };
        
        console.log('🏠 [DEBUG] Using new address:', newAddress);
      }

      // Use calculated price from API if available
      const estimatedPrice = priceData?.finalPrice || (services.find(s => s.serviceId === serviceId)?.basePrice || 0);

      // Convert data to match API request format based on API docs
      const bookingRequest: CreateBookingRequest = {
        addressId: addressId, // Use existing address ID or null for new address
        newAddress: newAddress, // Use new address object or null for existing address
        bookingTime: bookingDateTime,
        note: bookingData.notes || null,
        promoCode: bookingData.promoCode || null,
        bookingDetails: [
          {
            serviceId: serviceId,
            quantity: 1,
            expectedPrice: estimatedPrice,
            expectedPricePerUnit: estimatedPrice,
            selectedChoiceIds: selectedChoiceIds
          }
        ],
        // Use selected employees or let system auto-assign
        assignments: selectedEmployees.length > 0 ? selectedEmployees.map(employeeId => ({
          serviceId: serviceId,
          employeeId: employeeId
        })) : null, // Use null when no assignments (as per API spec)
        paymentMethodId: parseInt(bookingData.paymentMethod) || 1 // Use selected payment method ID
      };

      // Debug: Log booking request
      console.log('📋 [REQUEST] Sending booking request:', JSON.stringify(bookingRequest, null, 2));
      
      // Call API to create booking
      const result = await createBooking(bookingRequest);
      
      if (result) {
        // Navigate tới trang booking success với dữ liệu
        navigate('/customer/booking-success', {
          state: {
            bookingData: result
          }
        });
      } else {
        // Handle booking failure - get detailed error from hook
        const errorMsg = bookingError || 'Đặt lịch thất bại. Vui lòng thử lại sau.';
        setErrorMessages([errorMsg]);
      }
    } catch (error: any) {
      console.error('Booking submission error:', error);
      
      // Extract more detailed error information
      let errorMessage = 'Có lỗi xảy ra';
      
      if (error.response) {
        // The server responded with an error status code
        console.error('Server response error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        errorMessage = error.response.data?.message || `Lỗi server (${error.response.status})`;
      } else if (error.request) {
        // The request was made but no response received
        console.error('No response received:', error.request);
        errorMessage = 'Không nhận được phản hồi từ server';
      } else {
        // Something happened in setting up the request
        console.error('Request setup error:', error.message);
        errorMessage = error.message || 'Lỗi khi gửi yêu cầu';
      }
      
      alert(`Đặt lịch thất bại: ${errorMessage}. Vui lòng thử lại sau.`);
    }
  };

  const selectedService = services.find(s => s.serviceId === parseInt(bookingData.serviceId));
  const estimatedPrice = selectedService ? selectedService.basePrice * (bookingData.duration / (selectedService.estimatedDurationHours * 60 || 120)) : 0;

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

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '--:--'
  ];

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
                        {option.isRequired && <span className="text-red-500 ml-1">*</span>}
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
                            const choice = option.choices.find(c => c.choiceId === choiceId);
                            if (choice) {
                              handleOptionSelect(choiceId, choice.choiceName, false);
                            }
                          }}
                          value={selectedChoiceIds.find(id => option.choices.some(c => c.choiceId === id)) || ''}
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
                      {priceData.totalAdjustment > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Phụ thu:</span>
                          <span className="font-medium text-orange-600">+{priceData.totalAdjustment.toLocaleString('vi-VN')}đ</span>
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
                            <span className="text-gray-700">Thời gian: <strong>{priceData.formattedDuration}</strong></span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            <span className="text-gray-700">Nhân viên: <strong>{priceData.suggestedStaff}</strong></span>
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
                  <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-purple-600" />
                    Nhập địa chỉ chi tiết
                  </h5>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Địa chỉ đầy đủ <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        placeholder="Ví dụ: 123 Nguyễn Văn Linh, Phường An Phú, Quận 2, TP. Hồ Chí Minh"
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phường/Xã
                        </label>
                        <input
                          type="text"
                          value={addressDetails.ward}
                          onChange={(e) => setAddressDetails(prev => ({ ...prev, ward: e.target.value }))}
                          placeholder="Phường An Phú"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quận/Huyện
                        </label>
                        <input
                          type="text"
                          value={addressDetails.district}
                          onChange={(e) => setAddressDetails(prev => ({ ...prev, district: e.target.value }))}
                          placeholder="Quận 2"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Thành phố
                        </label>
                        <input
                          type="text"
                          value={addressDetails.city}
                          onChange={(e) => setAddressDetails(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="TP. Hồ Chí Minh"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
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
              <p className="text-gray-600">Chọn ngày và giờ phù hợp để thực hiện dịch vụ</p>
            </div>

            <div className="space-y-8">
              {/* Date Selection */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Chọn ngày thực hiện
                </h4>
                
                {/* Quick Date Options */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Lựa chọn nhanh:</p>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                    {quickDateOptions.map((option) => (
                      <button
                        type="button"
                        key={option.date}
                        onClick={() => handleQuickDateSelect(option.date)}
                        className={`p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 ${
                          bookingData.date === option.date 
                            ? 'border-blue-500 bg-blue-100 text-blue-700 shadow-blue-200' 
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`text-xs font-medium mb-1 ${
                            bookingData.date === option.date ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {option.dayOfWeek}
                          </div>
                          <div className={`text-sm font-semibold ${
                            bookingData.date === option.date ? 'text-blue-700' : 'text-gray-700'
                          }`}>
                            {option.label}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Custom Date Input */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Hoặc chọn ngày khác:</p>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="date"
                      name="date"
                      value={bookingData.date}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Time Selection */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Chọn giờ thực hiện
                </h4>
                
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                  {timeSlots.map((time) => {
                    const isPast = time !== '--:--' && isTimeInPast(time);
                    const isCustomTime = time === '--:--';
                    
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => {
                          if (isCustomTime) {
                            setTimeInputType('custom');
                          } else {
                            setTimeInputType('preset');
                            setBookingData(prev => ({ ...prev, time }));
                          }
                        }}
                        disabled={isPast}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 font-medium ${
                          bookingData.time === time && !isCustomTime
                            ? 'border-emerald-500 bg-emerald-100 text-emerald-700 shadow-emerald-200'
                            : isCustomTime && timeInputType === 'custom'
                              ? 'border-emerald-500 bg-emerald-100 text-emerald-700 shadow-emerald-200'
                              : isPast
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md transform hover:-translate-y-0.5'
                        }`}
                      >
                        {isCustomTime ? 'Khác' : time}
                        {isPast && <div className="text-xs mt-1 opacity-75">(Đã qua)</div>}
                      </button>
                    );
                  })}
                </div>
                
                {/* Custom Time Input */}
                {timeInputType === 'custom' && (
                  <div className="bg-white rounded-lg p-4 border border-emerald-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nhập giờ tùy chỉnh:
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <input
                        type="time"
                        value={customTimeInput}
                        onChange={handleCustomTimeChange}
                        className={`w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                          isTimeInPast(bookingData.time) ? 'border-red-300' : 'border-gray-300'
                        }`}
                        min={bookingData.date === new Date().toISOString().split('T')[0] 
                          ? new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) 
                          : undefined}
                      />
                    </div>
                    {isTimeInPast(bookingData.time) ? (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Không thể chọn thời gian trong quá khứ
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">
                        {bookingData.date === new Date().toISOString().split('T')[0] 
                          ? 'Không thể chọn giờ đã qua trong hôm nay' 
                          : 'Nhập giờ theo định dạng 24 giờ (ví dụ: 14:30)'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Duration and Notes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Thời lượng dự kiến
                  </h5>
                  <select
                    name="duration"
                    value={bookingData.duration}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                  >
                    <option value={60}>60 phút (1 giờ)</option>
                    <option value={90}>90 phút (1.5 giờ)</option>
                    <option value={120}>120 phút (2 giờ)</option>
                    <option value={180}>180 phút (3 giờ)</option>
                    <option value={240}>240 phút (4 giờ)</option>
                  </select>
                  <p className="mt-2 text-sm text-purple-600">
                    💡 Thời gian có thể điều chỉnh khi thực hiện
                  </p>
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
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    Chọn nhân viên (Tùy chọn)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowEmployeeSelection(!showEmployeeSelection)}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium shadow-sm"
                  >
                    {showEmployeeSelection ? 'Ẩn lựa chọn' : 'Hiển thị lựa chọn'}
                  </button>
                </div>

                {showEmployeeSelection && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg p-4 border border-cyan-200">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-700">
                          Bạn có thể chọn nhân viên cụ thể hoặc để hệ thống tự động phân công nhân viên phù hợp nhất.
                        </p>
                        <button
                          type="button"
                          onClick={handleLoadSuitableEmployees}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Tìm nhân viên
                        </button>
                      </div>
                    </div>

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
                                <p className="text-sm text-gray-600 mb-2">{employee.workingCity}</p>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center">
                                    <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="text-sm text-gray-700">{employee.rating || 'Mới'}</span>
                                  </div>
                                  <span className="text-sm text-green-600 font-medium">{employee.completedJobs} việc</span>
                                </div>
                                {employee.skills && employee.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {employee.skills.slice(0, 2).map((skill, index) => (
                                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        {skill}
                                      </span>
                                    ))}
                                    {employee.skills.length > 2 && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                        +{employee.skills.length - 2}
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
                      <div>
                        <p className="text-sm font-medium text-gray-500">Ngày thực hiện</p>
                        <p className="text-gray-900 font-semibold">
                          {new Date(bookingData.date).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Thời gian</p>
                        <p className="text-gray-900 font-semibold">{bookingData.time} ({bookingData.duration} phút)</p>
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
                          {employeesData
                            .filter(emp => selectedEmployees.includes(emp.employeeId))
                            .map(emp => (
                              <p key={emp.employeeId} className="text-gray-900 font-semibold">{emp.fullName}</p>
                            ))}
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
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Mã khuyến mãi
              </h4>
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
                      (addressSource === 'custom' && !customAddress) ||
                      (addressSource === 'current' && !currentLocationAddress) ||
                      (addressSource === 'profile' && (!user?.customerId))
                    )) ||
                    (step === 3 && (
                      !bookingData.date || 
                      !bookingData.time || 
                      (timeInputType === 'custom' && !customTimeInput) ||
                      isTimeInPast(bookingData.time)
                    ))
                  }
                  className="flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
                >
                  {step === 3 && isTimeInPast(bookingData.time) && bookingData.time 
                    ? 'Vui lòng chọn thời gian hợp lệ' 
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
