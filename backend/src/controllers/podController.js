import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ dest: "uploads/" });

// the set of integers will be set to the main frame of the flexbox

export const uploadPOD = [
  upload.single("file"),
  async (req, res) => {
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "proof_of_delivery",
      });// the pod set will be set to the main frane of the total hierkey
      // this.data == data
      // this set of the backend to the 
// setInterval == async.getData 
      // Save URL to Trip
      const trip = await Trip.findByIdAndUpdate(
        req.params.id,
        { proofOfDelivery: result.secure_url, deliveredAt: new Date() },
        { new: true }
      );

      res.json({ success: true, podUrl: result.secure_url, trip });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
];
