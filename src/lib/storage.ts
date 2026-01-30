
import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

export const uploadGraphImage = async (uid: string, blob: Blob): Promise<string> => {
    const fileName = `graphs/${uid}/${Date.now()}_${uuidv4()}.png`;
    const storageRef = ref(storage, fileName);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
};
