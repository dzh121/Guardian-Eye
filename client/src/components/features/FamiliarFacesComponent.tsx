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
  displayName: string;
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
    if (!user) {
      return;
    }
    // console.log(user.getIdToken());
    const facesRef = storageRef(storage, `${user?.uid}/known_faces/`);
    const facesList = await listAll(facesRef);
    const facesUrls = await Promise.all(
      facesList.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const name = itemRef.name;
        const displayName = name.substring(0, name.lastIndexOf("."));
        return { name, imageUrl: url, displayName };
      })
    );
    setFaces(facesUrls);
  };

  const handleAddFace = async () => {
    setMessage(null);
    if (newFace.name === "") {
      setMessage({ message: "Please enter a name.", type: "error" });
      return;
    }
    if (newFace.image === null) {
      setMessage({ message: "Please choose an image.", type: "error" });
      return;
    }
    if (newFace.name && newFace.image) {
      const imageName = `${newFace.name}.${newFace.image.name
        .split(".")
        .pop()}`;
      const displayName = newFace.name;
      if (
        faces.some((face) => face.displayName === displayName) ||
        newFaces.some((face) => face.displayName === displayName)
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

        URL.revokeObjectURL(newFace.imageUrl);

        setNewFaces([...newFaces, { name: imageName, imageUrl, displayName }]);
        setNewFace({ name: "", image: null, imageUrl: "" });
      } catch (error) {
        console.error("Error uploading image: ", error);
        setMessage({ message: "Error uploading image.", type: "error" });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        const imageUrl = URL.createObjectURL(file);

        // Revoke the previous object URL to avoid memory leaks
        if (newFace.imageUrl) {
          URL.revokeObjectURL(newFace.imageUrl);
        }
        const fileInput = document.getElementById(
          "file-upload"
        ) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
        setNewFace({ ...newFace, image: file, imageUrl });
      } else {
        setMessage({ message: "Please choose an image file.", type: "error" });
      }
    }
  };

  const generateDatFile = async () => {
    if (isUpdating) return;
    setMessage(null);
    setIsUpdating(true);
    if (!user) {
      setIsUpdating(false);
      throw new Error("User not logged in.");
    }

    for (const face of newFaces) {
      try {
        const encodings = await fetchEncodingsFromServer([face]);
        const filename = `${user.uid}/encodings.dat`;
        const file = new Blob([JSON.stringify(encodings.encodings)], {
          type: "application/json",
        });
        await uploadDatFileToFirebase(file, filename);

        if (encodings.errors.includes(face.displayName)) {
          throw new Error(`Face ${face.displayName} was not recognized.`);
        } else if (encodings.added_faces.length === 0) {
          throw new Error(`Face ${face.displayName} was not added.`);
        } else {
          if (
            !faces.some(
              (existingFace) => existingFace.displayName === face.displayName
            )
          ) {
            setFaces((faces) => [...faces, face]);
          }
          setNewFaces((newFaces) =>
            newFaces.filter((f) => f.displayName !== face.displayName)
          );
          setMessage({ message: "Face added successfully!", type: "success" });
        }
      } catch (error) {
        console.error(
          "Error generating .dat file for face:",
          face.displayName,
          error
        );
        setMessage({
          message: `Failed to generate .dat file for ${face.displayName}.`,
          type: "error",
        });
        const imageRef = storageRef(
          storage,
          `${user?.uid}/known_faces/${face.name}`
        );
        await deleteObject(imageRef).catch((err) =>
          console.error("Failed to delete image:", err)
        );
        setNewFaces((newFaces) =>
          newFaces.filter((f) => f.displayName !== face.displayName)
        );
      }
    }
    setIsUpdating(false);
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
    const response = await fetch("/api/add-faces", {
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
    if (isDeleting) return;
    setIsDeleting(true);
    setMessage(null);
    const imageRef = storageRef(
      storage,
      `${user?.uid}/known_faces/${face.name}`
    );

    const idToken = user ? await user.getIdToken() : null;
    if (!idToken || !user) {
      console.error("User not logged in.");
      setMessage({ message: "User not logged in.", type: "error" });
      setIsDeleting(false);
      return;
    }

    try {
      // Check if the face is in newFaces
      if (newFaces.some((newFace) => newFace.name === face.name)) {
        await deleteObject(imageRef);
        setNewFaces((newFaces) => newFaces.filter((f) => f.name !== face.name));
        setMessage({ message: "Face removed successfully.", type: "success" });
      } else {
        const response = await fetch("/api/remove-faces", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            faces: [{ name: face.name }],
            user_uid: user.uid,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to remove face from server");
        }

        await deleteObject(imageRef);
        setFaces((faces) => faces.filter((f) => f.name !== face.name));
        setMessage({ message: "Face removed successfully.", type: "success" });
      }
    } catch (error) {
      console.error("Error removing face:", error);
      setMessage({ message: "Error removing face.", type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  const uploadDatFileToFirebase = async (file: Blob, filename: string) => {
    const fileRef = storageRef(storage, filename);
    await uploadBytes(fileRef, file);
    // alert("Encodings file uploaded to Firebase Storage successfully.");
  };
  const totalPages = Math.ceil((faces.length + newFaces.length) / itemsPerPage);

  const currentItems = [
    ...faces,
    ...newFaces.filter(
      (newFace) =>
        !faces.some((face) => face.displayName === newFace.displayName)
    ),
  ].slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {currentItems.map((face, index) => (
          <Card key={index} style={{ maxWidth: "400px", marginBottom: "1rem" }}>
            <CardHeader>
              <Image
                className="object-cover"
                src={face.imageUrl}
                alt={face.displayName}
                width="100%"
                height="140px"
                style={{ borderRadius: "8px" }}
              />
            </CardHeader>
            <CardBody>
              <Input readOnly value={face.displayName} />
              <Button
                style={{ marginTop: "1rem" }}
                color="danger"
                onClick={() => handleRemoveFace(face)}
                disabled={isDeleting}
              >
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
          className="mb-2"
          fullWidth
          label="Name"
          value={newFace.name}
          disabled={isUpdating}
          onChange={(e) => setNewFace({ ...newFace, name: e.target.value })}
        />
        <input
          className="mt-2"
          disabled={isUpdating}
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
        <Button disabled={isUpdating} onClick={handleAddFace}>
          Add Face
        </Button>
        <Spacer y={0.5} />
        <Button
          disabled={isUpdating}
          className="mt-2"
          onClick={generateDatFile}
        >
          Update Familiars Faces
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
