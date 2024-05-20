import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Spacer,
  Image,
} from "@nextui-org/react";
import * as faceapi from "face-api.js";
import FamiliarFacesComponent from "./FamiliarFacesComponent";

import {
  uploadBytes,
  ref as storageRef,
  getDownloadURL,
} from "firebase/storage";

import { storage, auth } from "../../utils/firebase";
import { onAuthStateChanged } from "firebase/auth";

type Face = {
  name: string;
  image: File;
  imageUrl: string;
};

type Encodings = {
  [key: string]: Float32Array;
};

const UserFaces: React.FC = () => {
  const [faces, setFaces] = useState<Face[]>([]);
  const [newFace, setNewFace] = useState<{
    name: string;
    image: File | null;
    imageUrl: string;
  }>({
    name: "",
    image: null,
    imageUrl: "",
  });
  const user = auth.currentUser;

  const handleAddFace = async () => {
    console.log(faces);
    if (newFace.name && newFace.image) {
      try {
        const imageRef = storageRef(
          storage,
          `${user?.uid}/${newFace.image.name}`
        );
        await uploadBytes(imageRef, newFace.image);
        const imageUrl = await getDownloadURL(imageRef);

        const updatedFaces = [
          ...faces,
          { name: newFace.name, image: newFace.image, imageUrl },
        ];
        setFaces(updatedFaces);
        setNewFace({ name: "", image: null, imageUrl: "" });
      } catch (error) {
        console.error("Error uploading image: ", error);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        const imageUrl = URL.createObjectURL(file);
        setNewFace({ ...newFace, image: file, imageUrl });
      } else {
        alert("Please choose an image file.");
      }
    }
  };

  const generateDatFile = async () => {
    if (!user) {
      alert("You must be logged in to upload files.");
      return;
    }

    const encodings = await fetchEncodings(faces);
    const filename = `${user.uid}/encodings.dat`;
    const file = new Blob([JSON.stringify(encodings)], {
      type: "application/json",
    });
    await uploadDatFileToFirebase(file, filename);
  };

  const fetchEncodings = async (faces: Face[]): Promise<Encodings> => {
    const encodings: Encodings = {};
    for (const face of faces) {
      try {
        const img = await faceapi.fetchImage(face.imageUrl);
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (detections) {
          encodings[face.name] = detections.descriptor;
        }
      } catch (error) {
        console.error("Error fetching image for encoding: ", error);
        alert(`Failed to fetch image for ${face.name}.`);
      }
    }
    return encodings;
  };

  const uploadDatFileToFirebase = async (file: Blob, filename: string) => {
    const fileRef = storageRef(storage, filename);
    await uploadBytes(fileRef, file);
    alert("Encodings file uploaded to Firebase Storage successfully.");
  };

  return (
    <div>
      <FamiliarFacesComponent />
      <Spacer y={1} />
      <div>
        {faces.map((face, index) => (
          <Card key={index} style={{ maxWidth: "400px", marginBottom: "1rem" }}>
            <CardHeader>
              <Image
                src={face.imageUrl}
                alt={face.name}
                width="100%"
                height="140px"
              />
            </CardHeader>
            <CardBody>
              <Input readOnly value={face.name} />
            </CardBody>
          </Card>
        ))}
      </div>
      <Spacer y={2} />
      <Input
        placeholder="Name"
        value={newFace.name}
        onChange={(e) => setNewFace({ ...newFace, name: e.target.value })}
      />
      <input type="file" onChange={handleFileChange} accept="image/*" />
      {newFace.imageUrl && (
        <div>
          <Image
            src={newFace.imageUrl}
            alt="Selected face"
            width="140px"
            height="140px"
          />
        </div>
      )}
      <Spacer y={0.5} />
      <Button onPress={handleAddFace}>Add Face</Button>
      <Spacer y={0.5} />
      <Button onPress={generateDatFile}>Generate .dat File</Button>
    </div>
  );
};

export default UserFaces;
