import "./App.css";
import React, { useState, useEffect } from "react";
import Select from "react-select";
import Card from "./SummaryCard";
import { Line, Bar } from "react-chartjs-2"; 
import Chart from "chart.js/auto";

function App() {
    const [ubicacionActiva, setUbicacionActiva] = useState("");
    const [ultimaActualizacion, setUltimaActualizacion] = useState("");
    const [datosResumen, setDatosResumen] = useState({});
    const [listaUbicaciones, setListaUbicaciones] = useState([]);
    const [totalVacunados, setTotalVacunados] = useState(0);
    
    // Datos para gráficos
    const [datosCasos, setDatosCasos] = useState({
        labels: [],
        datasets: [{
            label: "Total Casos",
            data: [],
            borderColor: "blue",
            fill: false,
        }],
    });

    const [datosMuertes, setDatosMuertes] = useState({
        labels: [],
        datasets: [{
            label: "Total Muertes",
            data: [],
            backgroundColor: "rgba(255, 0, 0, 0.5)", 
        }],
    });

    const [datosRecuperados, setDatosRecuperados] = useState({
        labels: [],
        datasets: [{
            label: "Total Recuperados",
            data: [], 
            backgroundColor:  "rgba(255, 206, 86, 0.5)",
        }],
    });
    
    const baseUrl = "https://disease.sh/v3/covid-19/";

    const opcionesGrafico = (minY, maxY) => ({
        responsive: true,
        plugins: {
            tooltip: {
                enabled: true,
            },
        },
        maintainAspectRatio: false,
        scales: {
            y: {
                min: minY,
                max: maxY,
                title: {
                    display: true,
                    text: 'Cantidad',
                },
                beginAtZero: true,
            },
            x: {
                title: {
                    display: true,
                    text: 'Categoría',
                },
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 10,
                    rotation: 0,
                },
            },
        },
    });

    const obtenerPaises = async () => {
        try {
            const res = await fetch(`${baseUrl}countries`);
            const data = await res.json();
            const ubicacionesFormateadas = data
                .filter((pais) => pais.countryInfo.iso2)
                .map((pais) => ({
                    value: pais.countryInfo.iso2.toLowerCase(),
                    label: pais.country,
                }));

            setListaUbicaciones(ubicacionesFormateadas);
        } catch (error) {
            console.error("Error al obtener los países:", error);
        }
    };

    const obtenerDatosResumen = async () => {
        setDatosResumen({});
        try {
            const res = await fetch(`${baseUrl}countries/${ubicacionActiva}`);
            const data = await res.json();

            let datosFormateados = {};
            Object.keys(data).forEach((key) => {
                datosFormateados[key] = typeof data[key] === "number" ? data[key].toLocaleString() : data[key];
            });

            setDatosResumen(datosFormateados);
            setUltimaActualizacion(data.updated);
        } catch (error) {
            console.error("Error al obtener los datos de resumen:", error);
        }
    };

    const obtenerDatosHistoricos = async () => {
        try {
            const res = await fetch(`${baseUrl}historical/${ubicacionActiva}?lastdays=all`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();

            if (data && data.timeline) {
                const timeline = data.timeline;
                const fechas = Object.keys(timeline.cases);
                const casos = Object.values(timeline.cases);
                const muertes = timeline.deaths ? Object.values(timeline.deaths) : [];
                const recuperados = timeline.recovered ? Object.values(timeline.recovered) : [];

                if (casos.length === 0 || muertes.length === 0 || recuperados.length === 0) {
                    console.error("No hay datos de casos o muertes o recuperados disponibles.");
                    return; 
                }

                const allEqual = muertes.every((val) => val === muertes[0]);
                const muertesData = allEqual && muertes.length > 0
                    ? new Array(fechas.length).fill(muertes[0])
                    : muertes;
                
                const allEqual1 = recuperados.every((val) => val === recuperados[0]);
                const recuperadosData = allEqual1 && recuperados.length > 0
                        ? new Array(fechas.length).fill(recuperados[0])
                        : recuperados;

                setDatosCasos({
                    labels: fechas,
                    datasets: [{
                        label: "Total Casos",
                        data: casos,
                        borderColor: "blue",
                        fill: false,
                    }],
                });

                setDatosMuertes({
                    labels: fechas,
                    datasets: [{
                        label: "Total Muertes",
                        data: muertesData,
                        backgroundColor: "rgba(255, 0, 0, 0.5)", 
                    }],
                });

                setDatosRecuperados({
                    labels: fechas,
                    datasets: [{
                        label: "Total Recuperados",
                        data: recuperadosData,
                        backgroundColor: "rgba(86, 206, 86, 0.5)",
                    }],
                });
            } else {
                console.error("No hay datos de línea temporal disponibles para la ubicación dada:", data);
            }
        } catch (error) {
            console.error("Error al obtener datos históricos:", error);
        }
    };

    const obtenerDatosVacunacion = async () => {
        try {
            const res = await fetch(`https://disease.sh/v3/covid-19/vaccine/coverage/countries/${ubicacionActiva}`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            const timeline = data.timeline;
            const fechas = Object.keys(timeline);
            const ultimaFecha = fechas[fechas.length - 1];
            const totalVacunados = timeline[ultimaFecha];

            setTotalVacunados(totalVacunados);
        } catch (error) {
            console.error("Error al obtener datos de vacunación:", error);
        }
    };

    useEffect(() => {
        if (ubicacionActiva) {
            obtenerDatosResumen();
            obtenerDatosHistoricos();
            obtenerDatosVacunacion();
        }
    }, [ubicacionActiva]);

    useEffect(() => {
        obtenerPaises();
    }, []);

    return (
        <div className="App">
            <h1>Tablero COVID-19</h1>
            <div className="dashboard-container">
                <div className="dashboard-menu">
                    <Select
                        options={listaUbicaciones}
                        onChange={(opcionSeleccionada) => setUbicacionActiva(opcionSeleccionada.value)}
                        value={listaUbicaciones.find((opcion) => opcion.value === ubicacionActiva)}
                        className="dashboard-select"
                    />
                    <p className="update-date">
                        Última Actualización: {ultimaActualizacion ? new Date(ultimaActualizacion).toLocaleString() : "N/A"}
                    </p>
                </div>

                <div className="dashboard-timeseries">
                    <div style={{ flex: 1, padding: "10px" }}>
                        {datosCasos.labels.length > 0 ? (
                            <Line 
                                data={datosCasos} 
                                options={opcionesGrafico(Math.min(...datosCasos.datasets[0].data) || 0, Math.max(...datosCasos.datasets[0].data))} 
                                className="line-chart" 
                            />
                        ) : (
                            <p>No hay datos disponibles para Total Casos</p>
                        )}
                    </div>
                    
                    <div style={{ flex: 1, padding: "10px" }}>
                        {datosMuertes.labels.length > 0 ? (
                            <Bar     
                                data={datosMuertes} 
                                options={opcionesGrafico(datosMuertes.datasets[0].data.length > 0 ? 0 : Math.min(...datosMuertes), Math.max(...datosMuertes.datasets[0].data))} 
                                className="bar-chart" 
                            />
                        ) : (
                            <p>No hay datos disponibles para Total Muertes</p>
                        )}
                    </div>

                    <div style={{ flex: 1, padding: "10px" }}>
                        {datosRecuperados.labels.length > 0 ? (
                            <Bar     
                                data={datosRecuperados} 
                                options={opcionesGrafico(datosRecuperados.datasets[0].data.length > 0 ? 0 : Math.min(...datosRecuperados), Math.max(...datosRecuperados.datasets[0].data))} 
                                className="bar-chart" 
                            />
                        ) : (
                            <p>No hay datos disponibles para Total Recuperados</p>
                        )}
                    </div>
                </div>

                <div className="dashboard-summary">
                    <Card title="Total Casos" value={datosResumen.cases || "N/A"} />
                    <Card title="Total Recuperados" value={datosResumen.recovered || "N/A"} />
                    <Card title="Total Muertes" value={datosResumen.deaths || "N/A"} />
                    <Card title="Total Vacunados" value={totalVacunados.toLocaleString() || "N/A"} />
                </div>
            </div>
        </div>
    );
}

export default App;
