import { IDBDefaultDetails, IDBImage } from "@/types/indexdb/invoice";
import { DBSchema } from "idb";
export interface IndexedDBSchema extends DBSchema {
  inv_images: {
    key: string;
    value: IDBImage;
    indexes: {
      id: string;
    };
  };
  inv_default_details: {
    key: string;
    value: IDBDefaultDetails;
  };
}
