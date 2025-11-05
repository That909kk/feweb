// Address API Types for Vietnam 2-level administrative division

export interface Province {
  code: string;
  name: string;
  englishName: string;
  administrativeLevel: string;
  decree: string;
}

export interface Commune {
  code: string;
  name: string;
  englishName: string;
  administrativeLevel: string;
  provinceCode: string;
  provinceName: string;
  decree: string;
}

// API trả về array trực tiếp, không wrap trong object
export type ProvincesResponse = Province[];
export type CommunesResponse = Commune[];

export interface AddressFormData {
  provinceCode: string;
  provinceName: string;
  communeCode: string;
  communeName: string;
  streetAddress: string; // Số nhà, tên đường
  fullAddress: string; // Địa chỉ đầy đủ được format
}
