import { useState } from 'react';
import { QrCode, Download, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const QRCodeButton = () => {
  const { user } = useAuth();
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState(null);

  const generateQR = async () => {
    try {
      // Generar URL del perfil
      const profileUrl = `${window.location.origin}/profile/${user.id}`;
      
      // Usar una API externa para generar el QR (puedes usar qrcode.js o una API)
      // Por ahora, usaremos una API pública
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileUrl)}`;
      
      setQrData(qrUrl);
      setShowQR(true);
    } catch (error) {
      console.error('Error al generar QR:', error);
    }
  };

  const downloadQR = () => {
    if (qrData) {
      const link = document.createElement('a');
      link.href = qrData;
      link.download = `revistete-profile-${user.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <button
        onClick={generateQR}
        className="btn-primary flex items-center space-x-2"
      >
        <QrCode className="w-5 h-5" />
        <span>Generar QR del Perfil</span>
      </button>

      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 relative max-w-sm w-full">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Código QR de tu Perfil
            </h3>

            {qrData && (
              <div className="flex flex-col items-center space-y-4">
                <img
                  src={qrData}
                  alt="QR Code"
                  className="border-4 border-gray-200 rounded-lg"
                />
                <button
                  onClick={downloadQR}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Descargar QR</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default QRCodeButton;

