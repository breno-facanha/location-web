import instance from '@/instance/api';
import { useState, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'

interface HouseFormData {
  cep: string;
  endereco: string;
  cidade: string;
  estado: string;
  numero: string;
  complemento: string;
}

export default function HouseForm() {
  const [formData, setFormData] = useState<HouseFormData>({
    cep: '',
    endereco: '',
    cidade: '',
    estado: '',
    numero: '',
    complemento: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const fetchAddressByCep = async (cep: string) => {
    if (cep.length !== 8) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setError('CEP não encontrado');
        setFormData((prev) => ({
          ...prev,
          endereco: '',
          cidade: '',
          estado: '',
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          endereco: data.logradouro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
        }));
      }
    } catch (err) {
      setError('Erro ao buscar CEP');
    } finally {
      setLoading(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    setFormData((prev) => ({
      ...prev,
      cep: value,
    }));

    if (value.length === 8) {
      fetchAddressByCep(value);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.cep || !formData.endereco || !formData.cidade || !formData.estado || !formData.numero) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const payload = {
    address: `${formData.cep} + ${formData.cidade} + ${formData.endereco} + numero ${formData.numero}${formData.complemento ? `${formData.complemento}` : ''}`,
    };
    try {

    const result = await instance.post('/geocode', {address: payload.address });
    setLocation({ lat: result.data.latitude, lng: result.data.longitude });
    console.log('Resposta do backend:', result.data);
    setSuccess(true);
    
    setTimeout(() => {
      mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
    } catch (error) {
        console.error('Erro ao enviar dados para o backend:', error);
        setError('Erro ao processar seu endereço. Tente novamente.');
    }

  };

  return (
    <div className="max-w-xl mx-auto text-black/90">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-10">
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-linear-to-br from-blue-500 to-purple-600 p-3 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-4m0 0l4-4m-4 4L9 5m4 4l4 4" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-center bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Cadastro de Casa</h1>
          <p className="text-center text-gray-600">Preencha os dados do seu imóvel</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-4 rounded-lg mb-6 flex items-start">
            <svg className="w-5 h-5 mr-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-4 rounded-lg mb-6 flex items-start">
            <svg className="w-5 h-5 mr-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Casa cadastrada com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="cep" className="block text-sm font-bold text-gray-700 mb-3">
              <span className="inline-flex items-center">
                📍 CEP <span className="text-red-500 ml-1">*</span>
              </span>
            </label>
            <input
              type="text"
              id="cep"
              name="cep"
              value={formData.cep}
              onChange={handleCepChange}
              placeholder="00000-000"
              maxLength={8}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white transition"
              required
            />
            {loading && (
              <p className="text-sm text-blue-600 mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Buscando endereço...
              </p>
            )}
          </div>

          <div>
            <label htmlFor="endereco" className="block text-sm font-bold text-gray-700 mb-3">
              <span className="inline-flex items-center">
                🏘️ Endereço <span className="text-red-500 ml-1">*</span>
              </span>
            </label>
            <input
              type="text"
              id="endereco"
              name="endereco"
              value={formData.endereco}
              onChange={handleInputChange}
              placeholder="Rua, avenida, etc..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white transition"
              readOnly={loading}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="cidade" className="block text-sm font-bold text-gray-700 mb-3">
                <span className="inline-flex items-center">
                  🏙️ Cidade <span className="text-red-500 ml-1">*</span>
                </span>
              </label>
              <input
                type="text"
                id="cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleInputChange}
                placeholder="Sua cidade"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white transition"
                readOnly={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="estado" className="block text-sm font-bold text-gray-700 mb-3">
                <span className="inline-flex items-center">
                  🗺️ Estado <span className="text-red-500 ml-1">*</span>
                </span>
              </label>
              <input
                type="text"
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                placeholder="UF"
                maxLength={2}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white transition uppercase"
                readOnly={loading}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="numero" className="block text-sm font-bold text-gray-700 mb-3">
                <span className="inline-flex items-center">
                  🔢 Número <span className="text-red-500 ml-1">*</span>
                </span>
              </label>
              <input
                type="text"
                id="numero"
                name="numero"
                value={formData.numero}
                onChange={handleInputChange}
                placeholder="123"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white transition"
                required
              />
            </div>

            <div>
              <label htmlFor="complemento" className="block text-sm font-bold text-gray-700 mb-3">
                <span className="inline-flex items-center">
                  📝 Complemento <span className="text-transparent ml-1">*</span>
                </span>
              </label>
              <input
                type="text"
                id="complemento"
                name="complemento"
                value={formData.complemento}
                onChange={handleInputChange}
                placeholder="Apto, bloco, lote..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 bg-gray-50 hover:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-xl transition transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v4m0 4v4m0 4v4M4 12h4m4 0h4m4 0h4" />
                </svg>
                Carregando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-4-2m4 2l4-2" />
                </svg>
                Cadastrar Casa
              </>
            )}
          </button>
        </form>
      </div>
      <div className="w-full mt-10" id="mapa" ref={mapRef}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '400px' }}
            center={location || { lat: -5.200, lng: -39.3000 }}
            zoom={location ? 15 : 6}
          >
            {location && (
                <Marker 
                    position={{ lat: location?.lat, lng: location?.lng }} 
                    options={{
                        label: { 
                            text: 'consegui',
                            className: 'marker-label'
                        },
                    }}
                />
            )}
          </GoogleMap>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
