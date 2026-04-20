// DOM Elements
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const tabsBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const propertyGrid = document.getElementById('property-grid');
const resultCount = document.getElementById('result-count');

// User State
import { supabase } from './supabase-config.js';

let currentUser = null;

let properties = [];
// Removed static mock properties list to fetch from Supabase

// Expose globals for HTML inline event handlers
window.dashboardLogin = dashboardLogin;
window.handleBireyselLogin = handleBireyselLogin;
window.toggleBireyselAuth = toggleBireyselAuth;
window.handleBireyselSignup = handleBireyselSignup;
window.submitProfileDetails = submitProfileDetails;
window.openUserProfile = openUserProfile;
window.closeUserProfile = closeUserProfile;
window.toggleFavorite = toggleFavorite;
window.openRequestModal = openRequestModal;
window.closeRequestModal = closeRequestModal;
window.submitRequestForm = submitRequestForm;
window.openCorpSignupModal = openCorpSignupModal;
window.closeCorpSignupModal = closeCorpSignupModal;
window.submitCorpSignup = submitCorpSignup;
window.openAddPropertyModal = openAddPropertyModal;
window.closeAddPropertyModal = closeAddPropertyModal;
window.submitAddPropertyForm = submitAddPropertyForm;
window.updateFileName = updateFileName;
window.removePreviewImage = window.removePreviewImage || function(){};
window.openManagePropertyModal = openManagePropertyModal;
window.closeManagePropertyModal = closeManagePropertyModal;
window.submitManagePropertyForm = submitManagePropertyForm;
window.deleteCorporateProperty = deleteCorporateProperty;
window.openPropertyDetailModal = openPropertyDetailModal;
window.closePropertyDetailModal = closePropertyDetailModal;
window.applyFilters = applyFilters;
window.buyCoins = buyCoins;
window.openCoinModal = openCoinModal;
window.closeCoinModal = closeCoinModal;
window.logout = logout;
window.showUserMatch = showUserMatch;
window.closeUserMatch = closeUserMatch;
window.applyUserMatch = window.applyUserMatch || function(){};
window.deleteUserRequest = deleteUserRequest;

async function fetchInitialData() {
    console.log("Fetching live data from Supabase...");
    try {
        const { data: props, error: err1 } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
        if(!err1 && props) {
            properties = props;
            if(typeof corporateProperties !== 'undefined') {
                // To keep corporate UI valid
                corporateProperties = props;
            }
        }
        
        const { data: reqs, error: err2 } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
        if(!err2 && reqs) {
            mockUserRequests = reqs;
        }

        // Auto Refresh UI if active
        if(document.getElementById('dashboard-view')?.classList.contains('active')) {
            renderProperties(properties);
        }
        if(document.getElementById('corporate-view')?.classList.contains('active')) {
            if(typeof renderCorporateProperties === 'function') renderCorporateProperties();
        }
    } catch(e) {
        console.error("Supabase fetch failed. Check connection strings or RLS policies.", e);
    }
}

// Fetch on load
fetchInitialData();

// Realtime subscriptions
supabase.channel('public-events')
  .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
    console.log('Realtime change:', payload);
    fetchInitialData();
  })
  .subscribe();

// Initialize Defaults
document.addEventListener('DOMContentLoaded', () => {
    // Show Bireysel Tab by default
    switchTab('bireysel');
});

// Tab Logic
tabsBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
    });
});

function switchTab(tabId) {
    // Reset active classes
    tabsBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    // Set new active classes
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
}

// Emulate Authentication
function dashboardLogin(userType) {
    // Yönlendirme Animasyonu gibi çalışır
    loginView.style.opacity = '0';
    
    setTimeout(() => {
        loginView.classList.remove('active');
        
        if (userType === 'bireysel') {
            dashboardView.classList.add('active');
            
            // Form butonunu sadece bireysel kullanıcılar için görünür yap
            const requestBtn = document.getElementById('request-form-btn');
            if (requestBtn) {
                requestBtn.style.display = 'inline-flex';
            }
            
            if (currentUser) {
                document.getElementById('nav-user-name').textContent = currentUser.name.split(' ')[0] || 'Hesabım';
                let initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
                document.getElementById('nav-user-avatar').src = `https://ui-avatars.com/api/?name=${initial}&background=10B981&color=fff`;
            } else {
                document.getElementById('nav-user-name').textContent = 'Misafir';
                document.getElementById('nav-user-avatar').src = 'https://ui-avatars.com/api/?name=M&background=1E3A5F&color=fff';
            }

            // Verileri ekrana bas
            renderProperties(properties);
            
        } else if (userType === 'kurumsal') {
            const corpView = document.getElementById('corporate-view');
            if(corpView) {
                corpView.classList.add('active');
                renderCorporateProperties(); // Kurumsal İlanları Renderla
            }
        }
    }, 300);
}

// Bireysel Giriş Yap (Fake)
function handleBireyselLogin() {
    const email = document.getElementById('bireysel-login-email').value;
    
    // Fake login
    currentUser = {
        email: email,
        name: 'Ahmet',
        surname: 'Yılmaz',
        phone: '0555 123 4567',
        favorites: []
    };
    
    dashboardLogin('bireysel');
}

// Bireysel Auth Toggle
function toggleBireyselAuth(type) {
    if(type === 'login') {
        document.getElementById('bireysel-signup-area').style.display = 'none';
        document.getElementById('bireysel-login-area').style.display = 'block';
    } else {
        document.getElementById('bireysel-login-area').style.display = 'none';
        document.getElementById('bireysel-signup-area').style.display = 'block';
    }
}

// Bireysel Kayıt Ol
function handleBireyselSignup() {
    const email = document.getElementById('ind-signup-email').value;
    const pass = document.getElementById('ind-signup-pass').value;
    
    // Geçici currentUser oluştur
    currentUser = {
        email: email,
        name: '',
        surname: '',
        phone: '',
        favorites: []
    };

    // Giriş formunu kapatıp profili tamamla modunu aç
    loginView.style.opacity = '0';
    setTimeout(() => {
        loginView.classList.remove('active');
        document.getElementById('profile-setup-modal').classList.add('active');
        loginView.style.opacity = '1';
    }, 300);
}

// Profil Tamamlama Gönderimi
function submitProfileDetails() {
    const name = document.getElementById('setup-name').value;
    const surname = document.getElementById('setup-surname').value;
    const phone = document.getElementById('setup-phone').value;
    
    if(currentUser) {
        currentUser.name = name;
        currentUser.surname = surname;
        currentUser.phone = phone;
    }
    
    document.getElementById('profile-setup-modal').classList.remove('active');
    
    // Yönlendirme Animasyonu gibi çalışır ve dashboardu açar
    showCustomPopup({
        type: 'alert',
        icon: '<i class="fa-solid fa-circle-check" style="color: #10B981;"></i>',
        title: 'Kayıt Başarılı',
        message: 'Aramıza hoş geldiniz! Sizin için en uygun ilanları listeliyoruz.',
        onConfirm: () => {
             dashboardLogin('bireysel');
        }
    });
}

// Favori Ekle / Çıkar
function toggleFavorite(id, event) {
    if(event) event.stopPropagation(); // Kartın onClick olayını engelle

    if(!currentUser) {
        showCustomPopup({
            type: 'alert',
            icon: '<i class="fa-solid fa-user-lock" style="color: var(--accent);"></i>',
            title: 'Üye Girişi Gerekli',
            message: 'İlanları favoriye ekleyebilmek için lütfen ücretsiz üye olun veya giriş yapın.',
            onConfirm: () => { logout(); }
        });
        return;
    }

    const index = currentUser.favorites.findIndex(favId => favId === id);
    if(index === -1) {
        currentUser.favorites.push(id);
    } else {
        currentUser.favorites.splice(index, 1);
    }

    // Arayüzü güncelle
    renderProperties(properties); 
    
    // Eğer User Profile açıksa favorites'i de güncelle
    if (document.getElementById('user-profile-modal').classList.contains('active')) {
        renderFavoritesList();
    }
}

// Kullanıcı Profilini Aç
function openUserProfile() {
    const modal = document.getElementById('user-profile-modal');
    modal.classList.add('active');

    if(currentUser) {
        document.getElementById('modal-user-fullname').innerHTML = `${currentUser.name} ${currentUser.surname} <i class="fa-solid fa-circle-check" style="color:#10B981; font-size: 1rem;"></i>`;
        document.getElementById('modal-user-email').textContent = currentUser.email;
        document.getElementById('modal-user-phone').textContent = currentUser.phone;
        
        let initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
        document.getElementById('modal-user-avatar').src = `https://ui-avatars.com/api/?name=${initial}&background=10B981&color=fff`;
    }

    renderFavoritesList();
    renderUserRequestsList();
}

// Kullanıcı Profilini Kapat
function closeUserProfile() {
    document.getElementById('user-profile-modal').classList.remove('active');
}

// Favorileri Renderla
function renderFavoritesList() {
    const grid = document.getElementById('favorites-grid');
    const noFavMsg = document.getElementById('no-favorites-msg');
    const countSpan = document.getElementById('fav-count');

    grid.innerHTML = '';
    
    if(!currentUser || currentUser.favorites.length === 0) {
        grid.style.display = 'none';
        noFavMsg.style.display = 'block';
        countSpan.textContent = '0';
        return;
    }

    grid.style.display = 'grid';
    noFavMsg.style.display = 'none';
    countSpan.textContent = currentUser.favorites.length;

    const favProps = properties.filter(p => currentUser.favorites.includes(p.id));

    favProps.forEach(prop => {
        const badgeClass = prop.type.toLowerCase() === 'satılık' ? 'satilik' : 'kiralik';
        
        const cardHTML = `
            <div class="property-card" style="box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-color:var(--border); display: flex; flex-direction: column; cursor: pointer;" onclick="openPropertyDetailModal(${prop.id})">
                <div class="card-img-wrapper" style="height: 150px;">
                    <span class="badge ${badgeClass}">${prop.type.toUpperCase()}</span>
                    <button class="btn-fav active" onclick="toggleFavorite(${prop.id}, event)" style="position: absolute; top: 10px; right: 10px; z-index: 10;">
                        <i class="fa-solid fa-heart"></i>
                    </button>
                    <img src="${prop.image}" alt="${prop.title}">
                </div>
                <div class="card-body" style="padding: 1rem; flex: 1;">
                    <div class="card-price" style="font-size: 1.1rem;">${prop.price}</div>
                    <h4 class="card-title" style="font-size: 0.95rem; margin-bottom: 5px;">${prop.title}</h4>
                    <div class="card-location" style="font-size: 0.8rem;">
                        <i class="fa-solid fa-location-dot"></i> ${prop.location}
                    </div>
                </div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// Kullanıcı Taleplerini Renderla
function renderUserRequestsList() {
    const listHtml = document.getElementById('user-requests-list');
    const noReqMsg = document.getElementById('no-requests-msg');
    const countSpan = document.getElementById('req-count');
    
    if(!listHtml) return;

    listHtml.innerHTML = '';

    if (!currentUser || !currentUser.email) {
        listHtml.style.display = 'none';
        noReqMsg.style.display = 'block';
        countSpan.textContent = '0';
        return;
    }

    const myRequests = typeof mockUserRequests !== 'undefined' ? mockUserRequests.filter(r => r.userEmail === currentUser.email) : [];
    
    if(myRequests.length === 0) {
        listHtml.style.display = 'none';
        noReqMsg.style.display = 'block';
        countSpan.textContent = '0';
        return;
    }

    listHtml.style.display = 'flex';
    noReqMsg.style.display = 'none';
    countSpan.textContent = myRequests.length;

    myRequests.forEach(req => {
        listHtml.innerHTML += `
            <div style="background: var(--white); border: 1px solid var(--border); border-radius: var(--border-radius-sm); padding: 1.2rem; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-sm);">
                <div>
                    <h5 style="color: var(--primary); font-size: 1.05rem; margin-bottom: 4px;"> <span class="badge" style="background:var(--accent); position:relative; top:0; left:0; display:inline-block; padding:4px 8px; font-size:0.75rem; border-radius:4px; margin-right:6px;">${req.type}</span> ${req.mahalle} Mahallesi</h5>
                    <p style="color: var(--text-light); font-size: 0.85rem; font-weight: 500;">Oda: ${req.rooms} - Max Bütçe: ${req.maxPrice.toLocaleString('tr-TR')} ₺</p>
                </div>
                <button class="btn btn-accent" style="width: auto; background-color: #ef4444; padding: 8px 12px; font-size: 0.9rem;" onclick="deleteUserRequest(${req.id})" title="Talebi Sil">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        `;
    });
}

function deleteUserRequest(reqId) {
    showCustomPopup({
        type: 'confirm',
        icon: '<i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i>',
        title: 'Talebi Sil',
        message: 'Bu emlak arama talebini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
        onConfirm: () => {
            const index = mockUserRequests.findIndex(r => r.id === reqId);
            if (index > -1) {
                mockUserRequests.splice(index, 1);
                renderUserRequestsList();
                setTimeout(() => {
                    showCustomPopup({
                        type: 'alert',
                        icon: '<i class="fa-solid fa-trash-can" style="color: #10B981;"></i>',
                        title: 'Silindi',
                        message: 'Talebiniz başarıyla silindi.'
                    });
                }, 300);
            }
        }
    });
}

// Modal Logic
function openRequestModal() {
    document.getElementById('request-modal').classList.add('active');
}
function closeRequestModal() {
    document.getElementById('request-modal').classList.remove('active');
}

// Corporate Signup Modal Logic
function openCorpSignupModal() {
    document.getElementById('corp-signup-modal').classList.add('active');
}
function closeCorpSignupModal() {
    document.getElementById('corp-signup-modal').classList.remove('active');
}
function submitCorpSignup() {
    // Tüm inputlar HTML5 required olarak kontrol ediliyor varsayarak
    document.getElementById('corp-signup-modal').classList.remove('active');
    
    showCustomPopup({
        type: 'alert',
        icon: '<i class="fa-solid fa-clock-rotate-left" style="color: #F59E0B;"></i>',
        title: 'Belgeleriniz Onay Bekliyor',
        message: 'Talebiniz başarıyla alınmıştır. Sistem yöneticilerimiz iletmiş olduğunuz belgeleri (Vergi Levhası vb.) manuel olarak kontrol ettikten sonra kurumsal profiliniz onaylanacaktır.',
        onConfirm: () => {
            // Şimdilik formu sıfırlayıp Login ekranında kalacak
            const form = document.getElementById('corp-signup-form');
            if(form) form.reset();
            
            // File input UI temizliği
            document.querySelectorAll('.file-drop-area').forEach(el => {
                el.classList.remove('has-file');
                const p = el.querySelector('.file-name');
                if(p) p.textContent = 'Dosya Seçilmedi';
            });
        }
    });
}
function updateFileName(input, targetId) {
    const target = document.getElementById(targetId);
    const dropArea = input.closest('.file-drop-area');
    if(input.files && input.files[0]) {
        target.textContent = input.files[0].name;
        if(dropArea) dropArea.classList.add('has-file');
    } else {
        target.textContent = 'Dosya Seçilmedi';
        if(dropArea) dropArea.classList.remove('has-file');
    }
}

function submitRequestForm() {
    try {
        // Formdaki değerleri yakala
        const type = document.querySelector('input[name="req_type"]:checked') ? document.querySelector('input[name="req_type"]:checked').value : 'Satılık';
        
        // Ad, Soyad
        const inputs = document.querySelectorAll('.request-form .input-row input[type="text"]');
        const name = (inputs[0]?.value || '') + ' ' + (inputs[1]?.value || '');
        
        // Tel
        const phone = document.querySelector('.request-form input[type="tel"]')?.value || '';
        
        // Mahalle
        const mahalle = document.getElementById('selected-mahalle')?.value || 'Alipaşa';
        
        // Oda Sayısı
        const roomsSelect = document.querySelectorAll('.request-form select')[0];
        const rooms = roomsSelect ? roomsSelect.value : '2+1';
        
        // Bütçe
        const budgetInputs = document.querySelectorAll('.request-form .form-section:last-of-type .input-row input[type="number"]');
        const minPrice = budgetInputs[0] ? parseInt(budgetInputs[0].value) : 0;
        const maxPrice = budgetInputs[1] ? parseInt(budgetInputs[1].value) : 999999999;

        // Kurumsal panele eşleşmesi için listeye ekle
        if (typeof mockUserRequests !== 'undefined') {
            mockUserRequests.push({
                id: Date.now(),
                name: name.trim() !== '' ? name : (currentUser && currentUser.name ? currentUser.name + " " + currentUser.surname : "Yeni Müşteri"),
                phone: phone.trim() !== '' ? phone : (currentUser && currentUser.phone ? currentUser.phone : ""),
                userEmail: currentUser && currentUser.email ? currentUser.email : "guest@mail.com",
                type: type,
                mahalle: mahalle,
                minPrice: minPrice,
                maxPrice: maxPrice,
                rooms: rooms
            });
        }
    } catch (e) { console.error("Data push error", e); }

    showCustomPopup({
        type: 'alert',
        icon: '<i class="fa-solid fa-circle-check" style="color: #10B981;"></i>',
        title: 'Talebiniz Alındı',
        message: 'Talebiniz başarıyla alındı! Şimdi yapay zeka sistemimiz talebinizi piyasadaki tüm güncel ilanlarla analiz ediyor...',
        onConfirm: () => {
            closeRequestModal();
            document.querySelector('.request-form').reset();

            // Sadece Demo Amaçlı Gecikmeli Mocking (Eşleştirme Algoritması)
            setTimeout(() => {
                const match = corporateProperties.find(p => p.type === type && p.rooms === rooms && p.price >= minPrice && p.price <= maxPrice);
                if (match) {
                    const matchBtn = document.getElementById('ind-match-btn');
                    if(matchBtn) {
                        matchBtn.style.display = 'inline-flex';
                        matchBtn.setAttribute('data-target-id', match.id);
                    }
                    
                    showCustomPopup({
                        type: 'alert',
                        icon: '<i class="fa-solid fa-bolt" style="color: #F59E0B;"></i>',
                        title: 'Harika Haber! Eşleşme Bulundu',
                        message: 'Talebinize %100 uyan yeni bir konut tespit ettik! Sizin için hazırlanan evi incelemek için ekranın sağ üstündeki yeşil "Eşleşme Bulundu" butonuna tıklayabilirsiniz.'
                    });
                }
            }, 1500); // 1.5 Saniye sonra pop-up atar
        }
    });
}

// Click outside to close modal
window.addEventListener('click', function(event) {
    const modal = document.getElementById('request-modal');
    if (event.target === modal) {
        closeRequestModal();
    }
});

// Custom Popup Global Function
function showCustomPopup(options) {
    const popup = document.getElementById('custom-popup');
    document.getElementById('popup-icon').innerHTML = options.icon || '<i class="fa-solid fa-circle-info" style="color: var(--primary);"></i>';
    document.getElementById('popup-title').textContent = options.title || 'Bilgi';
    document.getElementById('popup-message').textContent = options.message || '';
    
    const btnContainer = document.getElementById('popup-buttons');
    btnContainer.innerHTML = ''; // Temizle
    
    if (options.type === 'confirm') {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-text';
        cancelBtn.textContent = 'İptal';
        cancelBtn.onclick = () => { popup.classList.remove('active'); };
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-primary';
        confirmBtn.textContent = 'Onayla';
        confirmBtn.onclick = () => { 
            popup.classList.remove('active'); 
            if(options.onConfirm) options.onConfirm(); 
        };
        
        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(confirmBtn);
    } else {
        // Alert type
        const okBtn = document.createElement('button');
        okBtn.className = 'btn btn-primary';
        okBtn.textContent = 'Tamam';
        okBtn.onclick = () => { 
            popup.classList.remove('active');
            if(options.onConfirm) options.onConfirm();
        };
        btnContainer.appendChild(okBtn);
    }
    
    popup.classList.add('active');
}

// iOS Picker Logic - Birden fazla picker desteği eklendi
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.ios-picker-list').forEach(pickerList => {
        // Picker'ın içerisindeki ebeveynden gizli alanı yakala
        const containerItem = pickerList.parentElement;
        const hiddenInput = containerItem.parentElement.querySelector('input[type="hidden"]');
        const pickerItems = pickerList.querySelectorAll('.ios-picker-item');

        pickerList.addEventListener('scroll', () => {
            const containerCenter = pickerList.getBoundingClientRect().top + (pickerList.clientHeight / 2);
            let closestItem = null;
            let closestDist = Infinity;
            
            pickerItems.forEach(item => {
                const itemCenter = item.getBoundingClientRect().top + (item.clientHeight / 2);
                const dist = Math.abs(containerCenter - itemCenter);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestItem = item;
                }
            });
            
            if (closestItem && hiddenInput) {
                pickerItems.forEach(i => i.classList.remove('selected'));
                closestItem.classList.add('selected');
                hiddenInput.value = closestItem.textContent.trim();
            }
        });

        // Tıklananı merkeze kaydırır
        pickerItems.forEach(item => {
            item.addEventListener('click', () => {
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });
    });
});


// Emulate Logout
function logout() {
    currentUser = null;
    document.getElementById('nav-user-name').textContent = 'Hesabım';
    document.getElementById('nav-user-avatar').src = 'https://ui-avatars.com/api/?name=Misafir&background=1E3A5F&color=fff';
    
    dashboardView.classList.remove('active');
    
    const corpView = document.getElementById('corporate-view');
    if (corpView) corpView.classList.remove('active');
    
    // Modalları kapat
    document.getElementById('user-profile-modal').classList.remove('active');
    
    loginView.classList.add('active');
    loginView.style.opacity = '1';
}

// ----------------------------------------------------
// KURUMSAL EMLAKÇI İŞLEMLERİ
// ----------------------------------------------------

let corporateCoins = 150; 
const unlockedUsers = new Set();

// Mock Bireysel Müşteri Talepleri
const mockUserRequests = [
    { id: 1, name: "Ahmet Yılmaz", phone: "+90 532 111 22 33", type: "Satılık", mahalle: "Alipaşa", minPrice: 1000000, maxPrice: 4000000, rooms: "3+1" },
    { id: 2, name: "Ayşe Kaya", phone: "+90 555 222 33 44", type: "Satılık", mahalle: "Alipaşa", minPrice: 2000000, maxPrice: 5000000, rooms: "3+1" },
    { id: 3, name: "Mehmet Demir", phone: "+90 543 333 44 55", type: "Satılık", mahalle: "Muhittin", minPrice: 1500000, maxPrice: 3500000, rooms: "2+1" },
    { id: 4, name: "Elif Çelik", phone: "+90 533 444 55 66", type: "Kiralık", mahalle: "Çobançeşme", minPrice: 10000, maxPrice: 40000, rooms: "2+1" }
];

// Mock Benim İlanlarım (Emlakçı)
let corporateProperties = [
    {
        id: 101,
        title: "Alipaşa Mah. Fırsat 3+1 Daire",
        type: "Satılık",
        price: 3500000,
        priceText: "3.500.000 ₺",
        mahalle: "Alipaşa",
        rooms: "3+1",
        area: "135 m²",
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 102,
        title: "Çobançeşme Mah. Ara Kat 2+1",
        type: "Kiralık",
        price: 28000,
        priceText: "28.000 ₺",
        mahalle: "Çobançeşme",
        rooms: "2+1",
        area: "110 m²",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
];

// İlan Ekleme ve Fotoğraf Önizleme Mantığı
const imageInput = document.getElementById('prop-images');
if (imageInput) {
    imageInput.addEventListener('change', function() {
        const previewContainer = document.getElementById('image-preview-container');
        previewContainer.innerHTML = '';
        const warning = document.getElementById('file-count-warning');

        if (this.files.length > 10) {
            warning.style.display = 'block';
            this.value = ''; // Limit aşımında seçimi sıfırla
            return;
        } else {
            warning.style.display = 'none';
        }

        Array.from(this.files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'image-preview-item';
                    previewContainer.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    });
}

function renderCorporateProperties() {
    const grid = document.getElementById('corp-property-grid');
    const countText = document.getElementById('corp-result-count');
    if(!grid) return;
    
    grid.innerHTML = '';
    countText.textContent = `${corporateProperties.length} İlan Yayınlandı`;

    corporateProperties.forEach(prop => {
        const badgeClass = prop.type.toLowerCase() === 'satılık' ? 'satilik' : 'kiralik';
        
        // EŞLEŞME ALGORİTMASI 
        // 1. İşlem türü, 2. Mahalle, 3. Oda Sayısı, 4. Bireyselin bütçesi emlakçının fiyatını kapsıyorsa eşleştir
        const matches = mockUserRequests.filter(req => {
            return req.type === prop.type &&
                   req.mahalle === prop.mahalle &&
                   req.rooms === prop.rooms &&
                   prop.price >= req.minPrice &&
                   prop.price <= req.maxPrice;
        });

        // Eşleşme varsa yeşil, yoksa sönük buton basılır
        const matchButtonHTML = matches.length > 0 ? 
            `<button class="badge-match" onclick="showMatches('${prop.id}', event)"><i class="fa-solid fa-users-viewfinder"></i> ${matches.length} Kullanıcı Eşleşmesi</button>` : 
            `<button class="badge-match" onclick="event.stopPropagation()" style="background-color: #CBD5E1; color: #64748B; cursor: default; box-shadow:none;"><i class="fa-solid fa-user-xmark"></i> Eşleşme Bekleniyor</button>`;

        const cardHTML = `
            <div class="property-card" style="display: flex; flex-direction: column; cursor: pointer;" onclick="openManagePropertyModal(${prop.id})">
                <div class="card-img-wrapper">
                    <span class="badge ${badgeClass}">${prop.type.toUpperCase()}</span>
                    <img src="${prop.image}" alt="${prop.title}">
                </div>
                <div class="card-body" style="flex: 1; display:flex; flex-direction: column;">
                    <div class="card-price">${prop.priceText}</div>
                    <h4 class="card-title">${prop.title}</h4>
                    <div class="card-location">
                        <i class="fa-solid fa-location-dot"></i> Tekirdağ, Çorlu, ${prop.mahalle}
                    </div>
                    <div class="card-features" style="margin-bottom: auto;">
                        <div class="feature-item">
                            <i class="fa-solid fa-bed"></i> ${prop.rooms}
                        </div>
                        <div class="feature-item">
                            <i class="fa-solid fa-ruler-combined"></i> ${prop.area}
                        </div>
                    </div>
                    ${matchButtonHTML}
                </div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// Bireysel Kullanıcı Eşleşmeleri Modalını Görüntüle
let currentMatchesForModal = [];

function showMatches(propId, event) {
    if(event) event.stopPropagation();
    
    const prop = corporateProperties.find(p => p.id == propId);
    if(!prop) return;

    currentMatchesForModal = mockUserRequests.filter(req => {
        return req.type === prop.type &&
               req.mahalle === prop.mahalle &&
               req.rooms === prop.rooms &&
               prop.price >= req.minPrice &&
               prop.price <= req.maxPrice;
    });

    renderMatchList();
    document.getElementById('match-modal').classList.add('active');
}

function renderMatchList() {
    const listHtml = document.getElementById('match-list');
    listHtml.innerHTML = '';

    // Navbar Bakiye Güncellemesi (varsa)
    const coinSpan = document.getElementById('nav-coin-amount');
    if(coinSpan) coinSpan.textContent = corporateCoins;

    if (currentMatchesForModal.length === 0) {
        listHtml.innerHTML = '<p style="text-align:center; color: var(--text-light); padding: 1rem;">Müşteri eşleşmesi bulunamadı.</p>';
        return;
    }

    currentMatchesForModal.forEach(m => {
        const isUnlocked = unlockedUsers.has(m.id);
        
        if (isUnlocked) {
            listHtml.innerHTML += `
                <div class="match-user-card" style="box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2); border-color: var(--primary);">
                    <div class="match-user-info">
                        <h5>${m.name} <i class="fa-solid fa-circle-check" style="color:#10B981; font-size: 0.9rem;" title="Kilidi Açıldı"></i></h5>
                        <p>Talep Ettiği: ${m.mahalle} Mah. - ${m.rooms} - ${m.type} - Max ${m.maxPrice.toLocaleString('tr-TR')} ₺</p>
                    </div>
                    <div class="match-user-contact">
                        <button class="btn-contact" title="Ara" onclick="window.location.href='tel:${m.phone}'"><i class="fa-solid fa-phone"></i></button>
                        <button class="btn-contact" title="Mesaj Gönder" onclick="alert('${m.name} adlı müşteriye WhatsApp mesajı yönlendiriliyor...')"><i class="fa-brands fa-whatsapp"></i></button>
                    </div>
                </div>
            `;
        } else {
            // İsimleri Maskele "Ahmet Y***"
            const nameParts = m.name.split(" ");
            let maskedName = "";
            if(nameParts.length > 1) {
                maskedName = nameParts[0] + " " + nameParts[nameParts.length-1].charAt(0) + "***";
            } else {
                maskedName = m.name.substring(0, 3) + "***";
            }

            listHtml.innerHTML += `
                <div class="match-user-card" style="position: relative; overflow: hidden; border-color: var(--border);">
                    <div class="match-user-info" style="filter: blur(4px); pointer-events: none; user-select: none;">
                        <h5>${maskedName}</h5>
                        <p>Talep Ettiği: ${m.mahalle} Mah. - ${m.rooms} - ${m.type} - Max ${m.maxPrice.toLocaleString('tr-TR')} ₺</p>
                    </div>
                    <div class="match-user-contact" style="filter: blur(4px); pointer-events: none;">
                        <button class="btn-contact"><i class="fa-solid fa-phone"></i></button>
                        <button class="btn-contact"><i class="fa-brands fa-whatsapp"></i></button>
                    </div>
                    
                    <div class="unlock-overlay" style="position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: inherit; z-index: 10;">
                        <p style="margin-bottom: 8px; font-weight: 600; font-size: 0.95rem; color: var(--text-main);"><i class="fa-solid fa-lock" style="color:var(--text-light); margin-right:4px;"></i> İletişim Bilgileri Kilitli</p>
                        <button class="btn btn-primary" style="padding: 8px 16px; border-radius: var(--border-radius-sm); font-size: 0.9rem;" onclick="unlockUser(${m.id})"><i class="fa-solid fa-unlock-keyhole"></i> Kilidi Aç (50 Coin)</button>
                    </div>
                </div>
            `;
        }
    });
}

function unlockUser(userId) {
    if (corporateCoins >= 50) {
        showCustomPopup({
            type: 'confirm',
            icon: '<i class="fa-solid fa-unlock-keyhole" style="color: #F59E0B;"></i>',
            title: 'Kilit Açma Onayı',
            message: 'Bu müşterinin iletişim bilgilerini açmak için 50 Coin harcanacak. Onaylıyor musunuz?',
            onConfirm: () => {
                corporateCoins -= 50;
                const coinSpan = document.getElementById('nav-coin-amount');
                if(coinSpan) coinSpan.textContent = corporateCoins;
                
                unlockedUsers.add(userId);
                renderMatchList();
                
                // Ardından başarı mesajı
                setTimeout(() => {
                    showCustomPopup({
                        type: 'alert',
                        icon: '<i class="fa-solid fa-circle-check" style="color: #10B981;"></i>',
                        title: 'İşlem Başarılı',
                        message: 'Kilit başarıyla açıldı! Müşteriyle sorunsuz iletişim kurabilirsiniz.'
                    });
                }, 100);
            }
        });
    } else {
        showCustomPopup({
            type: 'alert',
            icon: '<i class="fa-solid fa-triangle-exclamation" style="color: var(--accent);"></i>',
            title: 'Yetersiz Bakiye',
            message: 'Görünüşe göre jetonunuz kalmamış. Mağazaya yönlendiriliyorsunuz.',
            onConfirm: () => {
                closeMatchModal();
                openCoinModal();
            }
        });
    }
}


function closeMatchModal() {
    document.getElementById('match-modal').classList.remove('active');
}

// İlan Ekleme Form Modalı Aktiviteleri
function openAddPropertyModal() {
    document.getElementById('add-property-modal').classList.add('active');
}
function closeAddPropertyModal() {
    document.getElementById('add-property-modal').classList.remove('active');
    document.getElementById('image-preview-container').innerHTML = ''; // İmaj önizlemelerini temizle
}

// Jeton (Coin) Mağazası Fonksiyonları
function openCoinModal() {
    document.getElementById('coin-modal').classList.add('active');
}
function closeCoinModal() {
    document.getElementById('coin-modal').classList.remove('active');
}
function buyCoins(amount, price) {
    showCustomPopup({
        type: 'confirm',
        icon: '<i class="fa-solid fa-cart-shopping" style="color: var(--primary);"></i>',
        title: 'Satın Alma Onayı',
        message: `${amount} Coin paketi ${price} ₺ tutarındadır. İşlemi onaylıyor musunuz?`,
        onConfirm: () => {
            corporateCoins += parseInt(amount);
            const coinSpan = document.getElementById('nav-coin-amount');
            if(coinSpan) coinSpan.textContent = corporateCoins;
            
            setTimeout(() => {
                showCustomPopup({
                    type: 'alert',
                    icon: '<i class="fa-solid fa-sack-dollar" style="color: #10B981;"></i>',
                    title: 'Ödeme Başarılı',
                    message: `Hesabınıza başarıyla ${amount} Coin yüklendi. Güncel bakiye: ${corporateCoins} Coin`,
                    onConfirm: () => {
                        closeCoinModal();
                    }
                });
            }, 100);
        }
    });
}

function submitAddPropertyForm() {
    const title = document.getElementById('prop-title').value;
    const type = document.querySelector('input[name="prop_type"]:checked').value;
    const price = document.getElementById('prop-price').value;
    
    // iOS Wheeler içerisindeki hidden input value'sini alıyoruz
    const mahalle = document.getElementById('corp-selected-mahalle').value;
    const rooms = document.getElementById('prop-rooms').value;
    const area = document.getElementById('prop-area').value;
    const images = document.getElementById('prop-images').files;

    if (images.length > 10) {
        alert("En fazla 10 fotoğraf yükleyebilirsiniz!");
        return;
    }

    const newProp = {
        id: Date.now(),
        title: title,
        type: type,
        price: parseInt(price),
        priceText: parseInt(price).toLocaleString('tr-TR') + ' ₺',
        mahalle: mahalle,
        rooms: rooms,
        area: area + " m²",
        image: images.length > 0 ? URL.createObjectURL(images[0]) : "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    };

    corporateProperties.unshift(newProp);
    closeAddPropertyModal();
    renderCorporateProperties();
    document.getElementById('add-property-form').reset();

    showCustomPopup({
        type: 'alert',
        icon: '<i class="fa-solid fa-bullhorn" style="color: #10B981;"></i>',
        title: 'İlan Aktif',
        message: 'Kurumsal ilanınız başarıyla yayınlandı ve potansiyel müşterilerle eşleşmesi için analiz edildi!'
    });
}

function openManagePropertyModal(propId) {
    const prop = corporateProperties.find(p => p.id == propId);
    if(!prop) return;

    document.getElementById('manage-prop-id').value = prop.id;
    document.getElementById('manage-prop-title').value = prop.title;
    
    if (prop.type === "Satılık") {
        document.getElementById('manage-type-satilik').checked = true;
    } else {
        document.getElementById('manage-type-kiralik').checked = true;
    }

    document.getElementById('manage-prop-price').value = prop.price;
    document.getElementById('manage-prop-mahalle').value = prop.mahalle;

    let areaVal = prop.area;
    if (areaVal && areaVal.includes(" m²")) {
        areaVal = areaVal.replace(" m²", "");
    }
    document.getElementById('manage-prop-area').value = areaVal;
    document.getElementById('manage-prop-rooms').value = prop.rooms;

    document.getElementById('manage-property-modal').classList.add('active');
}

function closeManagePropertyModal() {
    document.getElementById('manage-property-modal').classList.remove('active');
}

function submitManagePropertyForm() {
    const propId = document.getElementById('manage-prop-id').value;
    const propIndex = corporateProperties.findIndex(p => p.id == propId);
    if(propIndex === -1) return;

    const title = document.getElementById('manage-prop-title').value;
    const type = document.querySelector('input[name="manage_prop_type"]:checked').value;
    const price = parseInt(document.getElementById('manage-prop-price').value);
    const rooms = document.getElementById('manage-prop-rooms').value;
    const areaStr = document.getElementById('manage-prop-area').value;
    const area = areaStr.includes('m') ? areaStr : areaStr + ' m²';

    corporateProperties[propIndex].title = title;
    corporateProperties[propIndex].type = type;
    corporateProperties[propIndex].price = price;
    corporateProperties[propIndex].priceText = price.toLocaleString('tr-TR') + ' ₺';
    corporateProperties[propIndex].rooms = rooms;
    corporateProperties[propIndex].area = area;

    closeManagePropertyModal();
    renderCorporateProperties();

    showCustomPopup({
        type: 'alert',
        icon: '<i class="fa-solid fa-circle-check" style="color: #10B981;"></i>',
        title: 'Güncelleme Başarılı',
        message: 'İlan detaylarınız başarıyla güncellendi.'
    });
}

function deleteCorporateProperty() {
    showCustomPopup({
        type: 'confirm',
        icon: '<i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i>',
        title: 'İlanı Kaldır',
        message: 'Bu ilanı yayından kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.',
        onConfirm: () => {
            const propId = document.getElementById('manage-prop-id').value;
            // Only update array if item exists
            const origLength = corporateProperties.length;
            corporateProperties = corporateProperties.filter(p => p.id != propId);
            if(corporateProperties.length < origLength) {
                closeManagePropertyModal();
                renderCorporateProperties();
                setTimeout(() => {
                    showCustomPopup({
                        type: 'alert',
                        icon: '<i class="fa-solid fa-trash-can" style="color: #10B981;"></i>',
                        title: 'Silindi',
                        message: 'İlan başarıyla kaldırıldı.'
                    });
                }, 300);
            }
        }
    });
}

// Render Properties Card
function renderProperties(data) {
    propertyGrid.innerHTML = '';
    
    if(data.length === 0) {
        propertyGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 2rem;">Arama kriterlerinize uygun ilan bulunamadı.</p>';
        resultCount.textContent = '0 İlan bulundu';
        return;
    }

    resultCount.textContent = `${data.length} İlan bulundu`;

    data.forEach(prop => {
        const badgeClass = prop.type.toLowerCase() === 'satılık' ? 'satilik' : 'kiralik';
        
        // Favori kontrolü
        let isFav = false;
        if(currentUser && currentUser.favorites.includes(prop.id)) {
            isFav = true;
        }
        
        const favIconClass = isFav ? "fa-solid fa-heart" : "fa-regular fa-heart";
        const favBtnClass = isFav ? "btn-fav active" : "btn-fav";

        const cardHTML = `
            <div class="property-card" style="cursor: pointer;" onclick="openPropertyDetailModal(${prop.id})">
                <div class="card-img-wrapper">
                    <span class="badge ${badgeClass}">${prop.type.toUpperCase()}</span>
                    <button class="${favBtnClass}" onclick="toggleFavorite(${prop.id}, event)">
                        <i class="${favIconClass}"></i>
                    </button>
                    <img src="${prop.image}" alt="${prop.title}">
                </div>
                <div class="card-body">
                    <div class="card-price">${prop.price}</div>
                    <h4 class="card-title">${prop.title}</h4>
                    <div class="card-location">
                        <i class="fa-solid fa-location-dot"></i> ${prop.location}
                    </div>
                    <div class="card-features">
                        <div class="feature-item">
                            <i class="fa-solid fa-bed"></i> ${prop.rooms}
                        </div>
                        <div class="feature-item">
                            <i class="fa-solid fa-ruler-combined"></i> ${prop.area}
                        </div>
                    </div>
                </div>
            </div>
        `;
        propertyGrid.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// Bireysel Kullanıcı İlan Detayı Gösterimi
function openPropertyDetailModal(propId) {
    // Önce bireysel mock'lar içinde ara (properties)
    let prop = properties.find(p => p.id == propId);
    
    // Eğer bireysellerde yoksa, kurumsal eşleşmeden gelen bir ilan olabilir
    if(!prop && typeof corporateProperties !== 'undefined') {
        const corpMatch = corporateProperties.find(p => p.id == propId);
        if(corpMatch) {
            prop = {
                id: corpMatch.id,
                title: corpMatch.title,
                type: corpMatch.type,
                price: corpMatch.priceText || corpMatch.price + ' ₺',
                location: corpMatch.mahalle + " Mah., Tekirdağ",
                rooms: corpMatch.rooms,
                area: corpMatch.area,
                image: corpMatch.image
            };
        }
    }

    if(!prop) return;

    document.getElementById('detail-image').src = prop.image;
    document.getElementById('detail-title').textContent = prop.title;
    document.getElementById('detail-price').textContent = prop.price;
    document.getElementById('detail-location').textContent = prop.location;
    document.getElementById('detail-rooms').textContent = prop.rooms;
    document.getElementById('detail-area').textContent = prop.area;
    
    document.getElementById('detail-desc').innerHTML = `
        Bu muhteşem <strong>${prop.rooms}</strong> yapıdaki <strong>${prop.type}</strong> mülk, hayallerinizi süsleyen lokasyonda, <strong>${prop.location}</strong> bölgesinde yer almaktadır.
        <br><br>Modern mimarisi, geniş ve ferah kullanım alanlarıyla (${prop.area}) ailenizle huzurlu bir yaşam sunmak için tasarlanmıştır. Ulaşım ağlarına, okul ve hastanelere çok yakın mesafede, değerli bir yaşam projesidir. Detaylı bilgi için lütfen iletişime geçiniz.
    `;

    const badge = document.getElementById('detail-badge');
    badge.textContent = prop.type.toUpperCase();
    if(prop.type.toLowerCase() === 'satılık') {
        badge.className = 'badge satilik';
        badge.style.backgroundColor = 'var(--primary)';
    }else{
        badge.className = 'badge kiralik';
        badge.style.backgroundColor = 'var(--accent)';
    }

    document.getElementById('property-detail-modal').classList.add('active');
}

function closePropertyDetailModal() {
    document.getElementById('property-detail-modal').classList.remove('active');
}

// Filtering Logic
function applyFilters() {
    const filterType = document.getElementById('filter-type').value;
    const filterLocation = document.getElementById('filter-location').value.toLowerCase();
    const filterRooms = document.getElementById('filter-rooms').value;

    const filteredData = properties.filter(prop => {
        const matchType = filterType === 'all' || prop.type === filterType;
        const matchLocation = prop.location.toLowerCase().includes(filterLocation);
        
        let matchRooms = true;
        if(filterRooms !== 'all') {
            if(filterRooms === '4+1') {
                matchRooms = prop.rooms === '4+1' || prop.rooms === '5+1' || prop.rooms.startsWith('4'); // just simple matching
            } else {
                matchRooms = prop.rooms === filterRooms;
            }
        }

        return matchType && matchLocation && matchRooms;
    });

    renderProperties(filteredData);
}

// Özel Eşleşme Butonuna Basıldığında Render Et
function showUserMatch() {
    const btn = document.getElementById('ind-match-btn');
    const matchedPropId = btn.getAttribute('data-target-id');
    const prop = corporateProperties.find(p => p.id == matchedPropId);

    if(prop) {
        // Objeyi standart listeleme dizilimine uygun hale getiriyoruz
        const mappedProp = {
            title: prop.title,
            type: prop.type,
            price: prop.priceText,
            location: prop.mahalle + " Mah., Tekirdağ",
            rooms: prop.rooms,
            area: prop.area,
            image: prop.image
        };
        
        renderProperties([mappedProp]); 
        
        const countSpan = document.getElementById('result-count');
        if(countSpan) countSpan.textContent = 'Size Özel %100 Uyumlu Eşleşme (1 İlan)';
        
        // Window scroll
        window.scrollTo({ 
            top: document.getElementById('property-grid').offsetTop - 100, 
            behavior: 'smooth' 
        });

        // Butonu kullandıktan sonra gizle
        btn.style.display = 'none';
    }
}
