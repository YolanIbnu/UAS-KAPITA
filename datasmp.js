const rowsPerPage = 10;
let currentPage = 1;
let allData = [];

function displayPage(data, page) {
    const tableBody = document.querySelector('#data-table tbody');
    tableBody.innerHTML = '';

    const start = (page - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, data.length);

    for (let i = start; i < end; i++) {
        const item = data[i];
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${item['Nama Satuan Pendidikan']}</td>
            <td>${item['Alamat']}</td>
            <td>${item['Kelurahan']}</td>
            <td>${item['Status']}</td>
            <td>${item['Latitude']}</td>
            <td>${item['Longitude']}</td>
        `;
        tableBody.appendChild(row);
    }
    renderPagination(data.length, page);
}

function renderPagination(totalRows, page) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(totalRows / rowsPerPage);

    function createButton(label, disabled = false) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.disabled = disabled;
        return btn;
    }

    // Previous
    const prevBtn = createButton('« Prev', page === 1);
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayPage(allData, currentPage);
        }
    });
    pagination.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = createButton(i);
        if (i === page) {
            pageBtn.style.backgroundColor = '#155ab6';
        }
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            displayPage(allData, currentPage);
        });
        pagination.appendChild(pageBtn);
    }

    // Next
    const nextBtn = createButton('Next »', page === totalPages);
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayPage(allData, currentPage);
        }
    });
    pagination.appendChild(nextBtn);
}

window.onload = function() {
    Papa.parse('data/DATA SMP DI BLORA.csv', {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            allData = results.data;
            displayPage(allData, currentPage);
        }
    });
};
