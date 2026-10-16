export type Property = {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  checkInTime: string;
  checkOutTime: string;
  status: "ACTIVE" | "INACTIVE";
  images: string[];
};

export type Amenity = {
  id: string;
  name: string;
  icon?: string;
};

export type RoomType = {
  id: string;
  propertyId: string;
  name: string;
  description: string;
  basePrice: number; // in VND
  maxGuests: number;
  bedType: string;
  bedCount: number;
  sizeM2: number;
  status: "ACTIVE" | "INACTIVE";
  amenities: Amenity[];
};

export type PhysicalRoom = {
  id: string;
  propertyId: string;
  roomTypeId: string;
  roomNumber: string;
  name: string;
  floor: number;
  status: "ACTIVE" | "INACTIVE";
  isBlocked: boolean;
  images: string[];
  roomType?: RoomType;
};
