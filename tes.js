// Tile layers dasar
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
});

var googleSatelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  maxZoom: 20,
  attribution: '&copy; Google'
});

// Inisialisasi peta hanya sekali dengan OSM sebagai default
var map = L.map('map', {
  center: [-6.9591, 111.4148],
  zoom: 10,
  layers: [osmLayer]
});

// Kontrol basemap (pilihan peta dasar)
var baseMaps = {
  "OpenStreetMap": osmLayer,
  "Google Satellite": googleSatelliteLayer
};
L.control.layers(baseMaps).addTo(map);

// Variabel untuk layer data
var batasWilayahLayer = null;
var jalanLayer = null;
var smpLayer = null;
var DisolveArea = null;
var Disolvenetwork = null;
var Servicearea = null;
var faskesLayer = null;


// Fungsi load Batas Wilayah (GeoJSON)
function loadBatasWilayahLayer() {
  return fetch('data/Batas Wilayah Adminstrasi.geojson')
    .then(res => res.json())
    .then(data => {
      batasWilayahLayer = L.geoJSON(data, {
        style: { color: 'green', weight: 2, opacity: 0.5 },
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.name) {
            layer.bindPopup("<b>Batas Wilayah:</b> " + feature.properties.name);
          }
        }
      });
      return batasWilayahLayer;
    });
}

// Fungsi load Jaringan Jalan (GeoJSON)
function loadJalanLayer() {
  return fetch('data/Jaringan Jalan.geojson')
    .then(res => res.json())
    .then(data => {
      jalanLayer = L.geoJSON(data, {
        style: { color: 'blue', weight: 3, opacity: 1 },
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.name) {
            layer.bindPopup("<b>Jalan:</b> " + feature.properties.name);
          }
        }
      });
      return jalanLayer;
    });
}

// Fungsi load Disolve Network 2km (GeoJSON)
function loadDisolveNetwork() {
  return fetch('data/Disolve Network 2km.geojson')
    .then(res => {
      console.log('Disolve Network 2km response:', res);
      return res.json();
    })
    .then(data => {
      console.log('Disolve Network 2km data:', data);
      Disolvenetwork = L.geoJSON(data, {
        style: { color: 'blue', weight: 3, opacity: 1 },
        onEachFeature: (feature, layer) => {
          // Ganti pengecekan properties.name ke properties["Nama Satuan Pendidikan"] jika name tidak ada
          var popupName = feature.properties.name || feature.properties["Nama Satuan Pendidikan"] || "(tanpa nama)";
          layer.bindPopup("<b>Disolvenetwork:</b> " + popupName);
        }
      });
      return Disolvenetwork;
    })
    .catch(err => {
      console.error('Error loading Disolve Network 2km:', err);
    });
}

// Fungsi load Disolve Area Faskes (GeoJSON)
function loadDisolveArea() {
  return fetch('data/Disolve Area Faskes.geojson')
    .then(res => {
      console.log('Disolve Area Faskes response:', res);
      return res.json();
    })
    .then(data => {
      console.log('Disolve Area Faskes data:', data);
      DisolveArea = L.geoJSON(data, {
        style: { color: 'blue', weight: 3, opacity: 1 },
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.name) {
            layer.bindPopup("<b>DisolveArea:</b> " + feature.properties.name);
          }
        }
      });
      return DisolveArea;
    })
    .catch(err => {
      console.error('Error loading Disolve Area Faskes:', err);
    });
}

// Fungsi load Service area (GeoJSON)
function loadServiceAreaLayer() {
  return fetch('data/Service Area.geojson')
    .then(res => {
      console.log('Service Area response:', res);
      if (!res.ok) throw new Error('Gagal fetch Service Area.geojson');
      return res.json();
    })
    .then(data => {
      console.log('Service Area data:', data);
      Servicearea = L.geoJSON(data, {
        style: { color: '#ff9800', weight: 2, fillOpacity: 0.15 },
        onEachFeature: function (feature, layer) {
          layer.bindPopup('Service Area Faskes');
        }
      });
      return Servicearea;
    })
    .catch(err => {
      console.error('Error loading Service Area:', err);
      return null;
    });
}

// Fungsi load SMP (CSV) dan buat marker
function loadSmpLayer() {
  return fetch('data/DATA SMP DI BLORA.csv')
    .then(res => res.text())
    .then(text => {
      var rows = text.split('\n');
      var smps = [];

      for (var i = 1; i < rows.length; i++) {
        var cols = rows[i].split(',');
        if (cols.length >= 7) {
          var name = cols[1].trim();
          var address = cols[2].trim();
          var kelurahan = cols[3].trim();
          var status = cols[4].trim();
          var lat = parseFloat(cols[5].trim());
          var lon = parseFloat(cols[6].trim());

          if (!isNaN(lat) && !isNaN(lon)) {
            smps.push({ name, address, kelurahan, status, lat, lon });
          }
        }
      }

      smpLayer = L.layerGroup(
        smps.map(smp => L.marker([smp.lat, smp.lon]).bindPopup(
          `<b>${smp.name}</b><br>` +
          `Alamat: ${smp.address}<br>` +
          `Kelurahan: ${smp.kelurahan}<br>` +
          `Status: ${smp.status}<br>` +
          `Latitude: ${smp.lat}<br>` +
          `Longitude: ${smp.lon}`
        ))
      );

      return smpLayer;
    });
}

// Fungsi load Faskes Blora (CSV) dan buat marker
function loadFaskesLayer() {
  return fetch('data/FASKES BLORA.csv')
    .then(res => res.text())
    .then(text => {
      var rows = text.split('\n');
      var faskesList = [];
      for (var i = 1; i < rows.length; i++) {
        var cols = rows[i].split(',');
        // Perbaiki parsing longitude: di CSV kolom 9 adalah Longtitude (harusnya longitude, dan urutan lat,lon dibalik)
        if (cols.length >= 10) {
          var name = cols[7].trim(); // Nama Fasyankes
          var lat = parseFloat(cols[8].trim()); // Latitude
          var lon = parseFloat(cols[9].trim()); // Longtitude (sebenarnya ini longitude)
          // Leaflet butuh [lat, lon], tapi pastikan data benar
          if (!isNaN(lat) && !isNaN(lon)) {
            faskesList.push({ name, address: (cols[2] ? cols[2].trim() : '') + ', ' + (cols[1] ? cols[1].trim() : ''), kelurahan: '', status: cols[3] ? cols[3].trim() : '', lat, lon });
          } else {
            console.warn('Data faskes tidak valid di baris', i+1, cols);
          }
        }
      }
      if (faskesList.length === 0) {
        console.error('Faskes CSV loaded, but no valid data found. Cek kolom Latitude/Longtitude dan format CSV.');
      }
      faskesLayer = L.layerGroup(
        faskesList.map(faskes => L.marker([faskes.lat, faskes.lon], {icon: L.icon({iconUrl: 'data/rumahsakit.png', iconSize: [28, 28]})}).bindPopup(
          `<b>${faskes.name}</b><br>` +
          `Alamat: ${faskes.address}<br>` +
          `Kelurahan: ${faskes.kelurahan}<br>` +
          `Status: ${faskes.status}<br>` +
          `Latitude: ${faskes.lat}<br>` +
          `Longitude: ${faskes.lon}`
        ))
      );
      return faskesLayer;
    })
    .catch(err => {
      console.error('Error loading Faskes BLORA.csv:', err);
    });
}

// Inisialisasi kontrol checkbox layer data dan eventnya
function initControlLayer() {
  document.getElementById('adminLayer').addEventListener('change', function () {
    if (this.checked) {
      map.addLayer(batasWilayahLayer);
    } else {
      map.removeLayer(batasWilayahLayer);
    }
  });

  document.getElementById('smpLayer').addEventListener('change', function () {
    if (this.checked) {
      map.addLayer(smpLayer);
    } else {
      map.removeLayer(smpLayer);
    }
  });

  document.getElementById('roadLayer').addEventListener('change', function () {
    if (this.checked) {
      map.addLayer(jalanLayer);
    } else {
      map.removeLayer(jalanLayer);
    }
  });

  document.getElementById('Disolvearea').addEventListener('change', function () {
    if (this.checked) {
      map.addLayer(DisolveArea);
    } else {
      map.removeLayer(DisolveArea);
    }
  });

  // Perbaiki id Servicearea
  document.getElementById('Servicearea').addEventListener('change', function () {
    if (this.checked) {
      map.addLayer(Servicearea);
    } else {
      map.removeLayer(Servicearea);
    }
  });

  // Hapus event handler Disolvenetwork karena layer tidak digunakan lagi
  // document.getElementById('Disolvenetwork').addEventListener('change', function () {
  //   if (this.checked) {
  //     map.addLayer(Disolvenetwork);
  //   } else {
  //     map.removeLayer(Disolvenetwork);
  //   }
  // });

  document.getElementById('faskes').addEventListener('change', function () {
    if (this.checked) {
      map.addLayer(faskesLayer);
    } else {
      map.removeLayer(faskesLayer);
    }
  });
}

// Load semua layer data lalu inisialisasi kontrol layer
Promise.all([
  loadBatasWilayahLayer(),
  loadJalanLayer(),
  loadSmpLayer(),
  loadFaskesLayer(),
  loadServiceAreaLayer(),
  loadDisolveArea(),
  loadDisolveNetwork()
])
  .then(initControlLayer)
  .catch(err => console.error('Error loading layers:', err));

// Toggle panel kontrol layer dengan tombol hamburger
document.getElementById('hamburger').addEventListener('click', function () {
  var controlLayer = document.getElementById('control-layer');
  controlLayer.classList.toggle('show');
});

// Fungsi menampilkan data CSV ke tabel (pakai PapaParse)
window.onload = function () {
  Papa.parse('data/DATA SMP DI BLORA.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      displayData(results.data);
    }
  });
};

// Fungsi tampilkan data ke tabel
function displayData(data) {
  var tableBody = document.querySelector('#data-table tbody');
  data.forEach(function (item, index) {
    var row = document.createElement('tr');

    var noCell = document.createElement('td');
    noCell.textContent = index + 1;
    row.appendChild(noCell);

    var namaCell = document.createElement('td');
    namaCell.textContent = item['Nama Satuan Pendidikan'];
    row.appendChild(namaCell);

    var alamatCell = document.createElement('td');
    alamatCell.textContent = item['Alamat'];
    row.appendChild(alamatCell);

    var kecamatanCell = document.createElement('td');
    kecamatanCell.textContent = item['Kecamatan'];
    row.appendChild(kecamatanCell);

    var kelurahanCell = document.createElement('td');
    kelurahanCell.textContent = item['Kelurahan'];
    row.appendChild(kelurahanCell);

    var statusCell = document.createElement('td');
    statusCell.textContent = item['Status'];
    row.appendChild(statusCell);

    var latCell = document.createElement('td');
    latCell.textContent = item['Latitude'];
    row.appendChild(latCell);

    var lonCell = document.createElement('td');
    lonCell.textContent = item['Longitude'];
    row.appendChild(lonCell);

    var aksiCell = document.createElement('td');
    var detailButton = document.createElement('button');
    detailButton.textContent = 'Detail';
    detailButton.onclick = function () {
      showDetail(item);
    };
    aksiCell.appendChild(detailButton);
    row.appendChild(aksiCell);

    tableBody.appendChild(row);
  });
}

// Popup detail data SMP
function showDetail(item) {
  var detailPopup = document.getElementById('detail-popup');
  var detailInfo = document.getElementById('detail-info');

  detailInfo.innerHTML = `
    <p><strong>Nama Satuan Pendidikan:</strong> ${item['Nama Satuan Pendidikan']}</p>
    <p><strong>Alamat:</strong> ${item['Alamat']}</p>
    <p><strong>Kecamatan:</strong> ${item['Kecamatan']}</p>
    <p><strong>Kelurahan:</strong> ${item['Kelurahan']}</p>
    <p><strong>Status:</strong> ${item['Status']}</p>
    <p><strong>Latitude:</strong> ${item['Latitude']}</p>
    <p><strong>Longitude:</strong> ${item['Longitude']}</p>
  `;

  detailPopup.style.display = 'flex';

  document.getElementById('close-popup').onclick = function () {
    detailPopup.style.display = 'none';
  };
}

// Tambahkan search control (pencarian alamat)
var geocoder = L.Control.geocoder({
  defaultMarkGeocode: false,
  placeholder: 'Cari lokasi atau alamat...'
}).addTo(map);

geocoder.on('markgeocode', function (e) {
  var bbox = e.geocode.bbox;
  var poly = L.polygon([
    bbox.getSouthEast(),
    bbox.getNorthEast(),
    bbox.getNorthWest(),
    bbox.getSouthWest()
  ]).addTo(map);
  map.fitBounds(poly.getBounds());
  setTimeout(() => map.removeLayer(poly), 5000);
});

// Tombol Lihat Data SMP navigasi ke halaman DataSMP.html
document.getElementById('btn-view-data-smp').addEventListener('click', function () {
  window.location.href = 'DataSMP.html';
});

// Tombol Lihat Data Faskes navigasi ke halaman DataFaskes.html
if(document.getElementById('btn-view-data-faskes')){
  document.getElementById('btn-view-data-faskes').addEventListener('click', function () {
    window.location.href = 'DataFaskes.html';
  });
}
