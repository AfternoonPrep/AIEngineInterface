import multer from "multer";
const storage = multer.diskStorage({
  destination: "uploads/", // Specify the destination folder where files will be stored
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix); // Set the filename of the uploaded file
  },
});

export default storage;
