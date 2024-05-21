import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Spacer,
  Image,
  Pagination,
} from "@nextui-org/react";
import {
  uploadBytes,
  ref as storageRef,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { storage, auth } from "../../utils/firebase";
import { getAuth } from "firebase/auth";
import { useWindowSize } from "../../utils/useWindowSize";

type Face = {
  name: string;
  imageUrl: string;
};

const FamiliarFacesComponent: React.FC = () => {
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
  const windowSize = useWindowSize();
  const [newFaces, setNewFaces] = useState<Face[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(windowSize.isLarge ? 8 : 4);
  const [message, setMessage] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      fetchFaces();
    }

    const cleanupUnprocessedImages = async () => {
      newFaces.forEach(async (face) => {
        const imageRef = storageRef(
          storage,
          `${user?.uid}/known_faces/${face.name}`
        );
        await deleteObject(imageRef).catch((err) =>
          console.error("Failed to delete image:", err)
        );
      });
    };

    const handleBeforeUnload = (event: any) => {
      if (newFaces.length > 0) {
        event.preventDefault();
        event.returnValue = "";
        cleanupUnprocessedImages();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user, newFaces]);

  const fetchFaces = async () => {
    const facesRef = storageRef(storage, `${user?.uid}/known_faces/`);
    const facesList = await listAll(facesRef);
    const facesUrls = await Promise.all(
      facesList.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return { name: itemRef.name, imageUrl: url };
      })
    );
    setFaces(facesUrls);
  };

  const handleAddFace = async () => {
    if (newFace.name && newFace.image) {
      const imageName = `${newFace.name}.${newFace.image.name
        .split(".")
        .pop()}`;

      // Check if the face already exists
      if (
        faces.some((face) => face.name === imageName) ||
        newFaces.some((face) => face.name === imageName)
      ) {
        setMessage({
          message: "Face with this name already exists.",
          type: "error",
        });
        return;
      }

      const imageRef = storageRef(
        storage,
        `${user?.uid}/known_faces/${imageName}`
      );
      try {
        await uploadBytes(imageRef, newFace.image);
        const imageUrl = await getDownloadURL(imageRef);

        const updatedNewFaces = [...newFaces, { name: imageName, imageUrl }];
        setNewFaces(updatedNewFaces);
        setNewFace({ name: "", image: null, imageUrl: "" });
      } catch (error) {
        console.error("Error uploading image: ", error);
        setMessage({ message: "Error uploading image.", type: "error" });
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
        setMessage({ message: "Please choose an image file.", type: "error" });
      }
    }
  };

  const generateDatFile = async () => {
    if (!user) {
      alert("You must be logged in to upload files.");
      return;
    }

    for (const face of newFaces) {
      try {
        const encodings = await fetchEncodingsFromServer([face]);
        const filename = `${user.uid}/encodings.dat`;
        const file = new Blob([JSON.stringify(encodings.encodings)], {
          type: "application/json",
        });
        await uploadDatFileToFirebase(file, filename);

        if (encodings.errors.includes(face.name)) {
          throw new Error(`Face ${face.name} was not recognized.`);
        } else if (encodings.added_faces.length === 0) {
          throw new Error(`Face ${face.name} was not added.`);
        } else {
          setFaces((faces) => [...faces, face]);
          setNewFaces((newFaces) =>
            newFaces.filter((f) => f.name !== face.name)
          );
          setMessage({ message: "Face added successfully!", type: "success" });
        }
      } catch (error) {
        console.error("Error generating .dat file for face:", face.name, error);
        setMessage({
          message: `Failed to generate .dat file for ${face.name}.`,
          type: "error",
        });
        const imageRef = storageRef(
          storage,
          `${user?.uid}/known_faces/${face.name}`
        );
        await deleteObject(imageRef).catch((err) =>
          console.error("Failed to delete image:", err)
        );
        setNewFaces((newFaces) => newFaces.filter((f) => f.name !== face.name));
      }
    }
  };

  const fetchEncodingsFromServer = async (
    faces: Face[]
  ): Promise<{
    encodings: { [key: string]: number[] };
    added_faces: string[];
    errors: string[];
  }> => {
    const user = getAuth().currentUser;
    const idToken = user ? await user.getIdToken() : null;
    if (!idToken || !user) {
      console.error("User not logged in.");
      return { encodings: {}, added_faces: [], errors: [] };
    }
    const response = await fetch("/api/generate-encodings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ faces, user_uid: user.uid }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch encodings from server");
    }

    return response.json();
  };
  const handleRemoveFace = async (face: Face) => {
    const imageRef = storageRef(
      storage,
      `${user?.uid}/known_faces/${face.name}`
    );
    await deleteObject(imageRef).catch((err) =>
      console.error("Failed to delete image:", err)
    );
    setFaces((faces) => faces.filter((f) => f.name !== face.name));
    setMessage({ message: "Face removed successfully.", type: "success" });
  };

  const uploadDatFileToFirebase = async (file: Blob, filename: string) => {
    const fileRef = storageRef(storage, filename);
    await uploadBytes(fileRef, file);
    // alert("Encodings file uploaded to Firebase Storage successfully.");
  };
  const totalPages = Math.ceil((faces.length + newFaces.length) / itemsPerPage);
  const currentItems = [...faces, ...newFaces].slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const Message: React.FC<{ message: string; type: "success" | "error" }> = ({
    message,
    type,
  }) => (
    <div
      style={{
        backgroundColor: type === "error" ? "#ff4d4f" : "#52c41a",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        textAlign: "center",
        marginBottom: "10px",
      }}
    >
      {message}
    </div>
  );

  return (
    <div>
      <h2 className="text-center text-2xl font-bold my-4">Familiar Faces</h2>
      {message && <Message message={message.message} type={message.type} />}
      <Spacer y={1} />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {currentItems.map((face, index) => (
          <Card key={index} style={{ maxWidth: "400px", marginBottom: "1rem" }}>
            <CardHeader>
              <Image
                className="object-cover"
                src={face.imageUrl}
                alt={face.name}
                width="100%"
                height="140px"
                style={{ borderRadius: "8px" }}
              />
            </CardHeader>
            <CardBody>
              <Input
                readOnly
                value={face.name}
                style={{ marginBottom: "1rem" }}
              />
              <Button color="danger" onClick={() => handleRemoveFace(face)}>
                Remove
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
      <Spacer y={2} />
      <div
        style={{
          maxWidth: "400px",
          margin: "auto",
          textAlign: "center",
          marginBottom: "1rem",
        }}
      >
        <Input
          isClearable
          fullWidth
          label="Name"
          value={newFace.name}
          onChange={(e) => setNewFace({ ...newFace, name: e.target.value })}
        />
        <input
          className="mt-2"
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: "none" }}
          id="file-upload"
        />
        <label className="m-2" htmlFor="file-upload">
          <Button as="span">Choose Image</Button>
        </label>
        {newFace.imageUrl && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "1rem 0",
            }}
          >
            <Image
              className="object-cover"
              src={newFace.imageUrl}
              alt="Selected face"
              width="140px"
              height="140px"
              style={{ borderRadius: "8px" }}
            />
          </div>
        )}
        <Button className="mt-2" onClick={handleAddFace}>
          Add Face
        </Button>
        <Spacer y={0.5} />
        <Button className="mt-2" onClick={generateDatFile}>
          Generate .dat File
        </Button>
      </div>
      <Spacer y={1} />
      <div className="w-full flex justify-center pb-4">
        <Pagination
          showControls
          total={totalPages}
          initialPage={1}
          page={currentPage}
          onChange={(page) => setCurrentPage(page)}
          size="lg"
          loop
          showShadow
        />
      </div>
    </div>
  );
};
export default FamiliarFacesComponent;
