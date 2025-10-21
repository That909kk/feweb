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
import Navigation from '../../components/Navigation';
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
          <div>
            <h3 className="text-xl font-semibold mb-6">Chọn loại dịch vụ</h3>
            
            {/* Categories Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium">Danh mục dịch vụ</h4>
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
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Xóa bộ lọc
                  </button>
                )}
              </div>
              {/* Hiển thị loading state cho danh mục */}
              {categoriesLoading ? (
                <div className="flex justify-center items-center py-6">
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
                      className={`flex flex-col items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 h-[130px] shadow-sm hover:shadow-md ${
                        selectedCategoryId === category.categoryId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:translate-y-[-2px]'
                      }`}
                    >
                      <div className="w-14 h-14 mb-2 flex items-center justify-center">
                        {category.iconUrl ? (
                          <img src={category.iconUrl} alt={category.categoryName} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-xl">{category.categoryName.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <span className="text-sm font-medium line-clamp-1">{category.categoryName}</span>
                        <span className="text-xs text-gray-500">{category.serviceCount} dịch vụ</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Services Section */}
            <div className="mt-6">
              <h4 className="text-lg font-medium mb-4">
                {selectedCategoryId 
                  ? `Dịch vụ thuộc ${categories.find(c => c.categoryId === selectedCategoryId)?.categoryName}` 
                  : "Tất cả dịch vụ"}
              </h4>
              
              {categoriesLoading || loadingCategoryServices ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(categoryWithServices ? categoryWithServices.services : services).map((service) => (
                    <div
                      key={service.serviceId}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        bookingData.serviceId === service.serviceId.toString()
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleServiceSelect(service.serviceId.toString())}
                    >
                      <div className="flex items-start">
                        <div className="w-14 h-14 rounded-lg mr-4 flex items-center justify-center overflow-hidden">
                          {service.iconUrl ? (
                            <img src={service.iconUrl} alt={service.name} className="w-full h-full object-contain" />
                          ) : (
                            <div className="text-3xl">{getServiceIcon(service.categoryName || 'other')}</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{service.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-600">
                              {service.basePrice.toLocaleString('vi-VN')}đ
                            </span>
                            <span className="text-sm text-gray-500">
                              {service.estimatedDurationHours * 60} phút
                            </span>
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
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h4 className="text-lg font-medium mb-4">Tùy chọn dịch vụ</h4>
                <div className="space-y-4">
                  {serviceOptions.options.map((option) => (
                    <div key={option.optionId}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {option.optionName} {option.isRequired && <span className="text-red-500">*</span>}
                      </label>
                      
                      {option.optionType === 'SINGLE_CHOICE_RADIO' && option.choices && (
                        <div className="space-y-2">
                          {option.choices.map((choice) => (
                            <label key={choice.choiceId} className="flex items-center">
                              <input
                                type="radio"
                                name={`option-${option.optionId}`}
                                value={choice.choiceId}
                                checked={selectedChoiceIds.includes(choice.choiceId)}
                                onChange={() => handleOptionSelect(choice.choiceId, choice.choiceName, false)}
                                className="mr-2"
                              />
                              {choice.choiceName}
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {option.optionType === 'SINGLE_CHOICE_DROPDOWN' && (
                        <select 
                          className="w-full p-2 border border-gray-300 rounded-lg"
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
                        <div className="space-y-2">
                          {option.choices.map((choice) => (
                            <label key={choice.choiceId} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedChoiceIds.includes(choice.choiceId)}
                                onChange={() => handleOptionSelect(choice.choiceId, choice.choiceName, true)}
                                className="mr-2"
                              />
                              {choice.choiceName}
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {option.optionType === 'QUANTITY_INPUT' && (
                        <input
                          type="number"
                          min="1"
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder={`Nhập ${option.optionName.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Price Calculation Display */}
                {priceData && (
                  <div className="mt-6 p-4 bg-white rounded-lg border-2 border-blue-200">
                    <h5 className="font-medium text-gray-900 mb-3">Chi phí ước tính</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Giá cơ bản:</span>
                        <span>{priceData.basePrice.toLocaleString('vi-VN')}đ</span>
                      </div>
                      {priceData.totalAdjustment > 0 && (
                        <div className="flex justify-between">
                          <span>Phụ thu:</span>
                          <span>+{priceData.totalAdjustment.toLocaleString('vi-VN')}đ</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Tổng cộng:</span>
                        <span className="text-blue-600">{priceData.finalPrice.toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        <div>Thời gian ước tính: {priceData.formattedDuration}</div>
                        <div>Số nhân viên đề xuất: {priceData.suggestedStaff}</div>
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
          <div>
            <h3 className="text-xl font-semibold mb-6">Thông tin địa điểm</h3>
            <div className="space-y-6">
              {/* Lựa chọn nguồn địa chỉ */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn địa chỉ từ
                </label>
                
                {/* Địa chỉ từ thông tin người dùng */}
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer flex items-start ${
                    addressSource === 'profile' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => handleAddressSourceChange('profile')}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    addressSource === 'profile' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <User className={`w-5 h-5 ${
                      addressSource === 'profile' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <h4 className="font-medium text-gray-900">Địa chỉ của bạn</h4>
                      {addressSource === 'profile' && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">Mặc định</span>
                      )}
                    </div>
                    {user?.profileData && 'address' in user.profileData && user.profileData.address ? (
                      <p className="text-sm text-gray-600">{user.profileData.address}</p>
                    ) : (
                      <p className="text-sm text-gray-600">Sử dụng địa chỉ mặc định từ hệ thống</p>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      addressSource === 'profile' 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {addressSource === 'profile' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Lấy địa chỉ hiện tại */}
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer flex items-start ${
                    addressSource === 'current' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => handleAddressSourceChange('current')}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    addressSource === 'current' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <NavigationIcon className={`w-5 h-5 ${
                      addressSource === 'current' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">Lấy vị trí hiện tại của bạn</h4>
                    {addressSource === 'current' && isLoadingLocation && (
                      <p className="text-sm text-blue-600">Đang lấy vị trí hiện tại...</p>
                    )}
                    {addressSource === 'current' && !isLoadingLocation && currentLocationAddress && (
                      <p className="text-sm text-gray-600 mt-1">{currentLocationAddress}</p>
                    )}
                    {addressSource === 'current' && !isLoadingLocation && !currentLocationAddress && (
                      <p className="text-sm text-gray-600">Sử dụng GPS để xác định vị trí hiện tại</p>
                    )}
                    {addressSource !== 'current' && (
                      <p className="text-sm text-gray-600">Sử dụng GPS để xác định vị trí hiện tại</p>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      addressSource === 'current' 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {addressSource === 'current' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Nhập địa chỉ tùy chỉnh */}
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer flex items-start ${
                    addressSource === 'custom' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => handleAddressSourceChange('custom')}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    addressSource === 'custom' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <MapPin className={`w-5 h-5 ${
                      addressSource === 'custom' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">Nhập địa chỉ mới</h4>
                    <p className="text-sm text-gray-600">Tự nhập địa chỉ chi tiết</p>
                  </div>
                  <div className="ml-4">
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      addressSource === 'custom' 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {addressSource === 'custom' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Hiển thị input tương ứng với lựa chọn */}
              {addressSource === 'current' && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingLocation ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Đang lấy vị trí...
                      </>
                    ) : (
                      <>
                        <NavigationIcon className="w-4 h-4 mr-2" />
                        Lấy vị trí hiện tại
                      </>
                    )}
                  </button>
                  
                  {currentLocationAddress && (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Địa chỉ hiện tại:</strong> {currentLocationAddress}
                        </p>

                      </div>
                      

                    </div>
                  )}
                  
                  {/* Hiển thị bản đồ nếu có tọa độ */}
                  {mapCoordinates && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vị trí trên bản đồ
                      </label>
                      {addressSource === 'current' && (
                        <p className="text-xs text-blue-600 mb-2 flex items-center">
                          <span className="mr-1">💡</span>
                          Nhấp trên bản đồ để thay đổi vị trí của bạn
                        </p>
                      )}
                      <div 
                        ref={mapContainerRef}
                        className={`w-full h-64 rounded-lg border border-gray-300 ${
                          addressSource === 'current' ? 'cursor-crosshair' : ''
                        }`}
                      ></div>
                    </div>
                  )}
                </div>
              )}

              {addressSource === 'custom' && (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900 mb-1">Nhập địa chỉ mới</h4>
                        <p className="text-sm text-green-700">
                          Vui lòng nhập địa chỉ chi tiết để nhân viên có thể tìm đến dễ dàng.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Địa chỉ chi tiết *
                    </label>
                    <textarea
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      placeholder="Ví dụ: 123 Nguyễn Văn Linh, Phường An Phú, Quận 2, TP. Hồ Chí Minh"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phường/Xã
                      </label>
                      <input
                        type="text"
                        value={addressDetails.ward}
                        onChange={(e) => setAddressDetails(prev => ({ ...prev, ward: e.target.value }))}
                        placeholder="Phường An Phú"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quận/Huyện
                      </label>
                      <input
                        type="text"
                        value={addressDetails.district}
                        onChange={(e) => setAddressDetails(prev => ({ ...prev, district: e.target.value }))}
                        placeholder="Quận 2"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thành phố
                      </label>
                      <input
                        type="text"
                        value={addressDetails.city}
                        onChange={(e) => setAddressDetails(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="TP. Hồ Chí Minh"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {addressSource === 'profile' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <User className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Sử dụng địa chỉ mặc định</h4>
                      <p className="text-sm text-blue-700">
                        Hệ thống sẽ sử dụng địa chỉ mặc định từ hồ sơ của bạn. 
                        Vui lòng đảm bảo địa chỉ trong hồ sơ đã chính xác và chi tiết.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h3 className="text-xl font-semibold mb-6">Chọn thời gian</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày *
                </label>
                
                {/* Tùy chọn ngày nhanh */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-3">
                  {quickDateOptions.map((option) => (
                    <div
                      key={option.date}
                      onClick={() => handleQuickDateSelect(option.date)}
                      className={`p-2 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 flex flex-col items-center ${
                        bookingData.date === option.date 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <span className="text-xs font-medium text-blue-600">{option.dayOfWeek}</span>
                      <span className={`text-sm font-medium ${bookingData.date === option.date ? 'text-blue-700' : 'text-gray-700'}`}>
                        {option.label}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Input ngày tùy chỉnh */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <input
                    type="date"
                    name="date"
                    value={bookingData.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 italic">Hoặc chọn ngày khác từ lịch</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giờ *
                </label>
                
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
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
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          bookingData.time === time && !isCustomTime
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : isCustomTime && timeInputType === 'custom'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : isPast
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {time}
                        {isPast && <span className="block text-xs mt-1">(Đã qua)</span>}
                      </button>
                    );
                  })}
                </div>
                
                {/* Hiển thị input tùy chỉnh nếu chọn --:-- */}
                {timeInputType === 'custom' && (
                  <div className="mt-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <input
                        type="time"
                        value={customTimeInput}
                        onChange={handleCustomTimeChange}
                        className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          isTimeInPast(bookingData.time) ? 'border-red-300' : 'border-gray-300'
                        }`}
                        min={bookingData.date === new Date().toISOString().split('T')[0] 
                          ? new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) 
                          : undefined}
                      />
                    </div>
                    {isTimeInPast(bookingData.time) ? (
                      <p className="mt-1 text-xs text-red-500 font-medium">
                        Không thể chọn thời gian trong quá khứ
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">
                        {bookingData.date === new Date().toISOString().split('T')[0] 
                          ? 'Không thể chọn giờ đã qua trong hôm nay' 
                          : 'Nhập giờ theo định dạng 24 giờ (ví dụ: 14:30)'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời lượng (phút)
                </label>
                <select
                  name="duration"
                  value={bookingData.duration}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={60}>60 phút</option>
                  <option value={90}>90 phút</option>
                  <option value={120}>120 phút</option>
                  <option value={180}>180 phút</option>
                  <option value={240}>240 phút</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  name="notes"
                  value={bookingData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ghi chú đặc biệt cho nhân viên (ví dụ: nhà có thú cưng, cần mang dụng cụ đặc biệt...)"
                />
              </div>

              {/* Employee Selection Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium">Chọn nhân viên (Tùy chọn)</h4>
                  <button
                    type="button"
                    onClick={() => setShowEmployeeSelection(!showEmployeeSelection)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showEmployeeSelection ? 'Ẩn' : 'Hiển thị'} lựa chọn nhân viên
                  </button>
                </div>

                {showEmployeeSelection && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Bạn có thể chọn nhân viên cụ thể hoặc để hệ thống tự động phân công
                      </p>
                      <button
                        type="button"
                        onClick={handleLoadSuitableEmployees}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Tìm nhân viên phù hợp
                      </button>
                    </div>

                    {employeesData && employeesData.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {employeesData.map((employee: SuitableEmployee) => (
                          <div
                            key={employee.employeeId}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                              selectedEmployees.includes(employee.employeeId)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                            onClick={() => {
                              setSelectedEmployees(prev => {
                                if (prev.includes(employee.employeeId)) {
                                  return prev.filter(id => id !== employee.employeeId);
                                } else {
                                  // For now, only allow one employee selection
                                  return [employee.employeeId];
                                }
                              });
                            }}
                          >
                            <div className="flex items-start">
                              <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
                                {employee.avatar ? (
                                  <img src={employee.avatar} alt={employee.fullName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                    <User className="w-6 h-6 text-gray-600" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{employee.fullName}</h5>
                                <p className="text-sm text-gray-600 mb-1">{employee.workingCity}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-yellow-600">
                                    ★ {employee.rating || 'Chưa có đánh giá'}
                                  </span>
                                  <span className="text-sm text-green-600">
                                    {employee.completedJobs} công việc
                                  </span>
                                </div>
                                {employee.skills && employee.skills.length > 0 && (
                                  <div className="mt-2">
                                    <div className="flex flex-wrap gap-1">
                                      {employee.skills.slice(0, 2).map((skill, index) => (
                                        <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {employeesData && employeesData.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                        <p>Không tìm thấy nhân viên phù hợp trong thời gian này</p>
                        <p className="text-sm mt-1">Hệ thống sẽ tự động phân công nhân viên khi có sẵn</p>
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
          <div>
            <h3 className="text-xl font-semibold mb-6">Xác nhận & Thanh toán</h3>
            
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">Thông tin đơn hàng</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Dịch vụ:</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày:</span>
                  <span className="font-medium">
                    {new Date(bookingData.date).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thời gian:</span>
                  <span className="font-medium">{bookingData.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thời lượng:</span>
                  <span className="font-medium">{bookingData.duration} phút</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Địa chỉ:</span>
                  <span className="font-medium text-right max-w-xs">{bookingData.address}</span>
                </div>
                {bookingData.notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ghi chú:</span>
                    <span className="font-medium text-right max-w-xs">{bookingData.notes}</span>
                  </div>
                )}
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Tổng cộng:</span>
                  <span className="text-blue-600">{estimatedPrice.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>

            {/* Promo Code */}
            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-gray-900">Mã khuyến mãi</h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={bookingData.promoCode || ''}
                  onChange={(e) => setBookingData(prev => ({ ...prev, promoCode: e.target.value }))}
                  placeholder="Nhập mã khuyến mãi (nếu có)"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    // TODO: Apply promo code logic
                    console.log('Applying promo code:', bookingData.promoCode);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Áp dụng
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Mã khuyến mãi sẽ được áp dụng vào tổng tiền cuối cùng
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Phương thức thanh toán</h4>
              <div className="space-y-3">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <label
                      key={method.methodId}
                      className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300"
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.methodId.toString()}
                        checked={bookingData.paymentMethod === method.methodId.toString()}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <CreditCard className="w-5 h-5 mr-3 text-gray-500" />
                      <div>
                        <div className="font-medium">{method.methodName}</div>
                        <div className="text-sm text-gray-500">
                          {method.methodCode}
                        </div>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                    Đang tải phương thức thanh toán...
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation role="CUSTOMER" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Messages */}
        {errorMessages.length > 0 && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <h3 className="text-red-800 font-medium">Lỗi khi đặt lịch</h3>
              <button 
                onClick={() => setErrorMessages([])} 
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              {errorMessages.map((message, index) => (
                <li key={index} className="text-red-700 text-sm">{message}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    step >= stepNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > stepNumber ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 4 && (
                  <div
                    className={`w-16 h-1 ml-4 ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
              Chọn dịch vụ
            </span>
            <span className={step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
              Địa điểm
            </span>
            <span className={step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
              Thời gian
            </span>
            <span className={step >= 4 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
              Xác nhận
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          {renderStepContent()}
          
          {/* Action Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={handlePrev}
              disabled={step === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Quay lại
            </button>
            
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {step === 3 && isTimeInPast(bookingData.time) && bookingData.time ? 'Vui lòng chọn thời gian hợp lệ' : 'Tiếp tục'}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                Xác nhận đặt lịch
              </button>
            )}
          </div>
        </div>
      </main>


    </div>
  );
};

export default BookingPage;
