'use client'
import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiCheck, FiPlus, FiTrash2 } from "react-icons/fi";
import Image from 'next/image';
import { syn, health } from './const'

interface Product {
  codigo: string;
  nombre: string;
  precio: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);


  const normalize = (text: string) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  useEffect(() => {
    const loadProducts = async () => {
      const res = await fetch('/output.json');
      const data: Product[] = await res.json();
      setProducts(data);
    };

    loadProducts();
  }, []);

  const filteredProducts = products.filter((product) =>
    normalize(product.nombre).includes(normalize(searchQuery))
  );

  const handleAddToSelected = (product: Product) => {
    const isAlreadySelected = selectedProducts.some(
      (selected) => selected.codigo === product.codigo
    );
    if (!isAlreadySelected) {
      setSelectedProducts((prev) => [...prev, product]);
    }
  };

  const handleRemoveFromSelected = (codigo: string) => {
    setSelectedProducts((prev) =>
      prev.filter((product) => product.codigo !== codigo)
    );
  };

  // Helpers para precios
  const parsePrice = (precio: string) =>
    parseFloat(precio.replace('S/', '').replace(',', '').trim()) || 0;

  const totalOriginal = selectedProducts.reduce(
    (acc, product) => acc + parsePrice(product.precio),
    0
  );

  const RECARGO_TOTAL = 70;
  const recargoUnitario = selectedProducts.length > 0 ? RECARGO_TOTAL / selectedProducts.length : 0;


  const totalCliente = selectedProducts.reduce(
    (acc, product) => acc + parsePrice(product.precio) * 1.2 + recargoUnitario,
    0
  );

  const generatePDF = async () => {
    setIsLoading(true); // Inicia el loading

    const content = document.getElementById("proforma");
    if (!content) {
      setIsLoading(false);
      return;
    }

    const html = content.outerHTML;

    const response = await fetch("/api/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html }),
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "proforma.pdf";
    a.click();

    setIsLoading(false); // Termina el loading
  };


  const VIATICO_COST = 50;
  const totalFinalCliente = totalCliente + VIATICO_COST;
  let dateToday = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',    // lunes, martes, etc.
    year: 'numeric',    // 2025
    month: 'long',      // abril
    day: 'numeric'      // 14
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center sm:text-left">
          🧪 Selección de Exámenes
        </h1>

        <div className="relative mb-6">
          <FiSearch className="absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar examen por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Exámenes Disponibles */}
          <div className="col-span-4 min-md:col-span-2">
            <h2 className="text-2xl font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FiPlus /> Exámenes Disponibles
            </h2>
            <ul className="space-y-3 max-h-[200px] sm:max-h-[300px] lg:max-h-[600px] overflow-y-auto overflow-x-hidden pr-1">
              {filteredProducts.map((product) => {
                const isSelected = selectedProducts.some(
                  (p) => p.codigo === product.codigo
                );

                return (
                  <li
                    key={product.codigo}
                    className="bg-white rounded-xl shadow p-4 flex justify-between items-center hover:shadow-md transition"
                  >
                    <div>
                      <div className="font-medium text-gray-800">{product.nombre}</div>
                      <div className="text-sm text-gray-500">{product.precio}</div>
                    </div>
                    <button
                      onClick={() => handleAddToSelected(product)}
                      disabled={isSelected}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${isSelected
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                        }`}
                    >
                      {isSelected ? <FiCheck /> : <FiPlus />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Exámenes Seleccionados */}
          <div className="col-span-4 sm:col-span-6 lg:col-span-4">
            <div className='w-full flex flex-col md:flex-row  items-center justify-between pb-2'>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2 flex  items-center gap-2">
                <FiCheck /> Seleccionados
              </h2>
              <div className='flex gap-2 items-center'>
                {/* Botón para generar PDF */}
                {selectedProducts.length > 0 && (
                  <button
                    onClick={generatePDF}
                    disabled={isLoading}
                    className={`bg-green-500 text-white px-6 py-2 rounded-xl hover:bg-green-600 transition cursor-pointer flex items-center justify-center ${isLoading ? 'bg-gray-500 cursor-wait' : ''}`}
                  >
                    {isLoading ? (
                      <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0114 0h-4a4 4 0 10-6 0H4z"></path>
                      </svg>
                    ) : (
                      "Generar Proforma PDF"
                    )}
                  </button>
                )}
                {/* Botón de reset */}
                {selectedProducts.length > 0 && (
                  <div className="text-center">
                    <button
                      onClick={() => setSelectedProducts([])}
                      className="bg-red-500 text-white px-6 py-2 rounded-xl hover:bg-red-600 transition cursor-pointer"
                    >
                      Limpiar Selección
                    </button>
                  </div>
                )}
              </div>

            </div>
            {selectedProducts.length === 0 ? (
              <p className="text-gray-500">No has seleccionado ningún examen.</p>
            ) : (
              <>
                {/* Primera tarjeta con precio original y precio cliente */}
                <div className="bg-white rounded-xl shadow p-6 mb-6">
                  <h2 className="text-2xl font-bold">Proforma interna de Health at home <span className="text-red-500">(NO MOSTRAR AL CLIENTE)</span></h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b text-gray-600">
                        <th className="py-2">Código</th>
                        <th>Nombre</th>
                        <th>Precio</th>
                        <th>Precio Cliente</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProducts.map((p) => {
                        const precio = parsePrice(p.precio);
                        const cliente = precio * 1.2 + recargoUnitario;
                        return (
                          <tr key={p.codigo} className="border-b hover:bg-gray-50">
                            <td className="py-2">{p.codigo}</td>
                            <td>{p.nombre}</td>
                            <td>S/ {precio.toFixed(2)}</td>
                            <td>S/ {cliente.toFixed(2)}</td>
                            <td>
                              <button
                                onClick={() => handleRemoveFromSelected(p.codigo)}
                                className="text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="font-semibold border-t bg-gray-100">
                        <td colSpan={2}>Totales</td>
                        <td>S/ {totalOriginal.toFixed(2)}</td>
                        <td>S/ {totalCliente.toFixed(2)}</td>
                        <td></td>
                      </tr>
                      <tr className="font-semibold bg-gray-50">
                        <td colSpan={3}>Costo de domicilio</td>
                        <td>S/ {VIATICO_COST.toFixed(2)}</td>
                        <td></td>
                      </tr>
                      <tr className="font-bold bg-blue-100">
                        <td colSpan={3}>Total final al cliente</td>
                        <td>S/ {totalFinalCliente.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Segunda tarjeta solo con precio cliente */}
                <div id="proforma" className='overflow-hidden'>
                  <div className='flex justify-between'>
                    <h2 className="text-2xl font-bold pb-4">Proforma de exámenes solicitados</h2>
                    <div className=''>
                      <img src={syn} width={50} alt="image" className='inline-block' />
                      <img src={health} width={50} alt="image2" className=' ml-4 inline-block' />
                    </div>

                  </div>
                  <p className='pb-4'>Fecha: {dateToday}</p>
                  <div className="bg-white rounded-xl p-6 mb-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b text-gray-600">
                          <th className="py-2">Código</th>
                          <th>Nombre</th>
                          <th>Precio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProducts.map((p) => {
                          const precio = parsePrice(p.precio);
                          const cliente = precio * 1.2 + recargoUnitario;
                          return (
                            <tr key={p.codigo} className="border-b hover:bg-gray-50">
                              <td className="py-2">{p.codigo}</td>
                              <td>{p.nombre}</td>
                              <td>S/ {cliente.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                        <tr className="font-semibold border-t">
                          <td colSpan={2}>Subtotal</td>
                          <td>S/ {totalCliente.toFixed(2)}</td>
                        </tr>
                        <tr className="font-semibold">
                          <td colSpan={2}>Costo de Domicilio</td>
                          <td>S/ {VIATICO_COST.toFixed(2)}</td>
                        </tr>
                        <tr className="font-bold">
                          <td colSpan={2}>Precio Total</td>
                          <td>S/ {totalFinalCliente.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </>
            )}


          </div>
        </div>
      </div>
    </div>
  );


}
