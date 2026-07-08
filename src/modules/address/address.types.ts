export interface CreateAddressDTO {
  firstName: string;
  lastName?: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface UpdateAddressDTO extends Partial<CreateAddressDTO> {}

export interface AddressResponse {
  _id: string;
  user: string;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
