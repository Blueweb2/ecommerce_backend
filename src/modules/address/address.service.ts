import { Address } from "./address.model";
import { CreateAddressDTO, UpdateAddressDTO } from "./address.types";

// ✅ GET USER ADDRESSES
export const getUserAddresses = async (userId: string) => {
  return Address.find({ user: userId }).sort({
    isDefault: -1,
    createdAt: -1,
  });
};

// ✅ CREATE ADDRESS
export const createAddress = async (
  userId: string,
  data: CreateAddressDTO
) => {
  const existingCount = await Address.countDocuments({ user: userId });

  const shouldBeDefault =
    existingCount === 0 ? true : Boolean(data.isDefault);

  if (shouldBeDefault && existingCount > 0) {
    await Address.updateMany({ user: userId }, { isDefault: false });
  }

  return Address.create({
    ...data,
    user: userId,
    isDefault: shouldBeDefault,
  });
};

// ✅ UPDATE ADDRESS
export const updateAddress = async (
  userId: string,
  addressId: string,
  data: UpdateAddressDTO
) => {
  const address = await Address.findOne({
    _id: addressId,
    user: userId,
  });

  if (!address) return null;

  const updatePayload: UpdateAddressDTO = { ...data };

  if (updatePayload.isDefault && !address.isDefault) {
    await Address.updateMany({ user: userId }, { isDefault: false });
  }

  if (updatePayload.isDefault === false && address.isDefault) {
    delete updatePayload.isDefault;
  }

  if (Object.keys(updatePayload).length === 0) {
    return address;
  }

  return Address.findOneAndUpdate(
    { _id: addressId, user: userId },
    { $set: updatePayload },
    { new: true, runValidators: true }
  );
};

// ✅ DELETE ADDRESS
export const deleteAddress = async (
  userId: string,
  addressId: string
) => {
  const address = await Address.findOne({
    _id: addressId,
    user: userId,
  });

  if (!address) return null;

  await address.deleteOne();

  // handle default fallback
  if (address.isDefault) {
    const nextAddress = await Address.findOne({ user: userId }).sort({
      createdAt: -1,
    });

    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  return true;
};

// ✅ SET DEFAULT ADDRESS
export const setDefaultAddress = async (
  userId: string,
  addressId: string
) => {
  const address = await Address.findOne({
    _id: addressId,
    user: userId,
  });

  if (!address) return null;

  if (!address.isDefault) {
    await Address.updateMany({ user: userId }, { isDefault: false });

    address.isDefault = true;
    await address.save();
  }

  return address;
};
