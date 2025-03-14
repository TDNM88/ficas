"use client";
import React from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

function MainComponent() {
  const [product, setProduct] = useState("");
  const [brushSize, setBrushSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [image, setImage] = useState(null);
  const [mask, setMask] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 400,
    height: 400,
  });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [instructions, setInstructions] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState('');

  const products = {
    "C1012 Glacier White": "https://via.placeholder.com/300?text=C1012",
    "C1026 Polar": "https://via.placeholder.com/300?text=C1026",
    "C3269 Ash Grey": "https://via.placeholder.com/300?text=C3269",
    "C3168 Silver Wave": "https://via.placeholder.com/300?text=C3168",
    "C1005 Milky White": "https://via.placeholder.com/300?text=C1005",
    "C2103 Onyx Carrara": "https://via.placeholder.com/300?text=C2103",
    "C2104 Massa": "https://via.placeholder.com/300?text=C2104",
    "C3105 Casla Cloudy": "https://via.placeholder.com/300?text=C3105",
    "C3146 Casla Nova": "https://via.placeholder.com/300?text=C3146",
    "C2240 Marquin": "https://via.placeholder.com/300?text=C2240",
    "C2262 Concrete (Honed)": "https://via.placeholder.com/300?text=C2262",
    "C3311 Calacatta Sky": "https://via.placeholder.com/300?text=C3311",
    "C3346 Massimo": "https://via.placeholder.com/300?text=C3346",
    "C4143 Mario": "https://via.placeholder.com/300?text=C4143",
    "C4145 Marina": "https://via.placeholder.com/300?text=C4145",
    "C4202 Calacatta Gold": "https://via.placeholder.com/300?text=C4202",
    "C1205 Casla Everest": "https://via.placeholder.com/300?text=C1205",
    "C4211 Calacatta Supreme": "https://via.placeholder.com/300?text=C4211",
    "C4204 Calacatta Classic": "https://via.placeholder.com/300?text=C4204",
    "C1102 Super White": "https://via.placeholder.com/300?text=C1102",
    "C4246 Casla Mystery": "https://via.placeholder.com/300?text=C4246",
    "C4345 Oro": "https://via.placeholder.com/300?text=C4345",
    "C4346 Luxe": "https://via.placeholder.com/300?text=C4346",
    "C4342 Casla Eternal": "https://via.placeholder.com/300?text=C4342",
    "C4221 Athena": "https://via.placeholder.com/300?text=C4221",
    "C4255 Calacatta Extra": "https://via.placeholder.com/300?text=C4255",
  };

  const quotes = [
    "AI đang xử lý hình ảnh...",
    "Đang áp dụng texture đá...",
    "Hoàn thiện chi tiết cuối cùng...",
    "Chỉ còn chút xíu nữa thôi..."
  ];

  const handleProductSelection = (productName) => {
    setProduct(productName);
    setShowPreview(true);
  };

  const handleBrushSizeChange = (e) => {
    setBrushSize(parseInt(e.target.value));
  };

  const handleImageUpload = (event) => {
    const uploadedImage = event.target.files?.[0];
    if (uploadedImage) {
      setImage(uploadedImage);
      const img = new Image();
      img.src = URL.createObjectURL(uploadedImage);
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }
      };
    }
  };

  const handleMouseDown = (event) => {
    setDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setLastX(event.clientX - rect.left);
      setLastY(event.clientY - rect.top);
    }
  };

  const handleMouseMove = (event) => {
    if (drawing && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "black";
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        setLastX(x);
        setLastY(y);
      }
    }
  };

  const handleMouseUp = () => {
    setDrawing(false);
    if (canvasRef.current) {
      const maskDataUrl = canvasRef.current.toDataURL("image/png");
      setMask(maskDataUrl);
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setMask(null);
    }
  };

  const handleImageGeneration = async () => {
    if (!image || !mask || !product) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setLoading(true);
    setProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('mask', dataURLtoBlob(mask));
      formData.append('product', product);

      const response = await axios.post('/api/tensor-art', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });

      setGeneratedImages([...generatedImages, response.data.url]);
      toast.success('Tạo ảnh thành công!');
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) && err.response
        ? `Lỗi từ server: ${err.response.data.message || err.message}`
        : `Có lỗi xảy ra: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`;
      setError(errorMessage);
      toast.error('Có lỗi khi tạo ảnh');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      canvasRef.current &&
      imageDimensions.width > 0 &&
      imageDimensions.height > 0
    ) {
      canvasRef.current.width = imageDimensions.width;
      canvasRef.current.height = imageDimensions.height;
    }
  }, [imageDimensions]);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="bg-blue-800 text-white p-4 mb-4 flex justify-between items-center rounded-lg">
        <div className="flex items-center gap-2">
          <img
            src="https://www.tdnm.cloud/logo.png"
            alt="Logo"
            className="w-12 h-12"
          />
          <h1 className="text-2xl font-bold">Ứng dụng tạo ảnh AI</h1>
        </div>
        <nav className="flex space-x-4">
          <a href="#" className="text-white hover:text-gray-300">
            Trang chủ
          </a>
          <a href="#" className="text-white hover:text-gray-300">
            Sản phẩm
          </a>
          <a href="#" className="text-white hover:text-gray-300">
            Liên hệ
          </a>
        </nav>
      </header>

      <button
        onClick={() => setInstructions(!instructions)}
        className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200 px-4 py-2 rounded-md"
      >
        {instructions ? "Ẩn hướng dẫn" : "Xem hướng dẫn sử dụng"}
      </button>

      {instructions && (
        <div className="mb-6 bg-blue-50 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-blue-800 mb-2">
            Hướng dẫn sử dụng:
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-blue-800">
            <li>Tải lên hình ảnh của bạn</li>
            <li>Sử dụng bút vẽ để tô vùng bạn muốn thay đổi</li>
            <li>Chọn mẫu sản phẩm bạn muốn áp dụng</li>
            <li>Nhấn nút "Tạo ảnh" để xem kết quả</li>
            <li>Tải về hoặc xem phóng to các ảnh đã tạo</li>
          </ol>
        </div>
      )}

      <div className="mb-4">
        <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "upload"
                ? "text-blue-800 border-b-2 border-blue-800"
                : "text-gray-500 hover:text-blue-800"
            }`}
            onClick={() => setActiveTab("upload")}
          >
            Tải ảnh lên
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "edit"
                ? "text-blue-800 border-b-2 border-blue-800"
                : "text-gray-500 hover:text-blue-800"
            }`}
            onClick={() => setActiveTab("edit")}
          >
            Chỉnh sửa
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "results"
                ? "text-blue-800 border-b-2 border-blue-800"
                : "text-gray-500 hover:text-blue-800"
            }`}
            onClick={() => setActiveTab("results")}
          >
            Kết quả
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        {activeTab === "upload" && (
          <div>
            <h2 className="text-xl font-bold text-blue-800 mb-4">
              Tải lên hình ảnh của bạn
            </h2>
            <label htmlFor="image-upload" className="text-blue-800 block mb-2">
              Chọn hình ảnh để tải lên
            </label>
            <input
              type="file"
              id="image-upload"
              onChange={handleImageUpload}
              className="w-full p-2 border border-blue-300 rounded mb-4"
              accept="image/*"
            />

            {image && (
              <div className="flex justify-center">
                <img
                  src={URL.createObjectURL(image)}
                  alt="Uploaded Image"
                  className="max-h-[400px] object-contain border-2 border-gray-300 shadow-md rounded-lg"
                />
              </div>
            )}

            {image && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setActiveTab("edit")}
                  className="bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Tiếp tục chỉnh sửa
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "edit" && (
          <div>
            {image ? (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-blue-800 mb-4">
                  Chỉnh sửa hình ảnh
                </h2>
                <div
                  className="relative mx-auto"
                  style={{
                    height: `${imageDimensions.height}px`,
                    width: `${imageDimensions.width}px`,
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="absolute top-0 left-0 border-2 border-gray-300 shadow-md rounded-lg z-10"
                    style={{
                      width: `${imageDimensions.width}px`,
                      height: `${imageDimensions.height}px`,
                    }}
                  />
                  <img
                    ref={imageRef}
                    src={URL.createObjectURL(image)}
                    alt="Uploaded Image"
                    className="absolute top-0 left-0 object-contain border-2 border-gray-300 shadow-md rounded-lg"
                    style={{
                      width: `${imageDimensions.width}px`,
                      height: `${imageDimensions.height}px`,
                    }}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label htmlFor="brush-size" className="text-blue-800">
                    Kích thước bút:
                  </label>
                  <input
                    type="range"
                    id="brush-size"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={handleBrushSizeChange}
                    className="flex-1"
                  />
                  <span className="text-blue-800 min-w-[2rem] text-right">
                    {brushSize}
                  </span>
                  <button
                    onClick={clearCanvas}
                    className="ml-2 px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    Xóa vùng vẽ
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-blue-800 mb-2">
                    Chọn mẫu sản phẩm:
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-2">
                    {Object.keys(products).map((productName) => (
                      <button
                        key={productName}
                        onClick={() => handleProductSelection(productName)}
                        className={`h-auto py-2 px-3 text-xs border rounded ${
                          productName === product
                            ? "bg-blue-800 text-white"
                            : "border-gray-300 hover:border-blue-500"
                        }`}
                      >
                        {productName}
                      </button>
                    ))}
                  </div>
                </div>

                {showPreview && product && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">
                      Mẫu đã chọn:
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="border-2 border-blue-300 rounded-lg p-2 w-1/3">
                        <img
                          src={products[product]}
                          alt={product}
                          className="w-full h-auto object-cover"
                        />
                      </div>
                      <div className="w-2/3">
                        <p className="text-blue-800 font-medium">{product}</p>
                        <p className="text-gray-600 text-sm">
                          Mẫu này sẽ được áp dụng vào vùng bạn đã tô
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleImageGeneration}
                    className="bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!image || !mask || !product || loading}
                  >
                    {loading ? "Đang xử lý..." : "Tạo ảnh"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-blue-800">Vui lòng tải lên hình ảnh trước</p>
                <button
                  onClick={() => setActiveTab("upload")}
                  className="mt-4 bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Tải ảnh lên
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "results" && (
          <div>
            {loading ? (
              <div className="bg-blue-50 border border-blue-300 p-6 rounded-lg">
                <div className="flex flex-col items-center py-10">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-center text-blue-800 mb-2">
                    {quotes[currentQuote]}
                  </p>
                  <p className="text-center text-blue-800 text-sm">
                    Tiến trình: {progress}% - Thời gian chờ dự kiến: 1-2 phút
                  </p>
                </div>
              </div>
            ) : generatedImages.length > 0 ? (
              <div>
                <h2 className="text-xl font-bold text-blue-800 mb-4">
                  Ảnh đã tạo
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {generatedImages.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative border-2 border-gray-300 shadow-md rounded-lg p-2 cursor-pointer hover:border-blue-500 transition-all"
                      onClick={() => {
                        setSelectedImage(imageUrl);
                        setShowDialog(true);
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={`Generated ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-lg">
                        <p className="text-white text-sm">Ảnh {index + 1}</p>
                      </div>
                      <a
                        href={imageUrl}
                        download={`generated_image_${index + 1}.png`}
                        className="absolute top-3 right-3 bg-white text-blue-800 hover:bg-blue-100 p-2 rounded-full shadow-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                      </a>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setActiveTab("edit")}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    Quay lại chỉnh sửa
                  </button>
                  <button
                    onClick={() => {
                      setImage(null);
                      setMask(null);
                      setProduct(null);
                      setActiveTab("upload");
                    }}
                    className="bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Tạo ảnh mới
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-blue-800">Chưa có ảnh nào được tạo</p>
                <button
                  onClick={() => setActiveTab("edit")}
                  className="mt-4 bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Tạo ảnh mới
                </button>
              </div>
            )}
          </div>
        )}

        {showDialog && selectedImage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto">
              <img
                src={selectedImage}
                alt="Selected Image"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setShowDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Đóng
                </button>
                <a
                  href={selectedImage}
                  download="generated_image.png"
                  className="inline-flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Tải ảnh về máy
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;