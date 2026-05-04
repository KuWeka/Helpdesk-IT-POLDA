Tanggal: 2026-04-18

> Baca ini dulu sebelum mulai menggunakan prompt sesi 1–6

---

## Persiapan Sebelum Mulai

### 1. Tool yang direkomendasikan
Gunakan salah satu dari:
- **Cursor AI** (paling direkomendasikan) — Agent mode dengan `Ctrl+I`
- **Windsurf** — Cascade mode
- **GitHub Copilot** di VS Code — Chat dengan `@workspace`

### 2. Lampiran yang wajib disertakan di setiap sesi

Di setiap sesi, **selain teks prompt**, lampirkan juga file-file berikut:

| File | Alasan |
|---|---|
| `src/styles/theme.css` | Supaya AI tahu CSS variables yang tersedia |
| `src/components/ui/chart.jsx` | Supaya AI tahu exact API ChartContainer |
| `src/components/layout/app-sidebar.jsx` | Referensi komponen layout yang sudah benar |
| Screenshot template shadcn (2 foto) | Referensi visual target tampilan |

### 3. Screenshot yang perlu disiapkan
Ambil screenshot dari:
- `https://ui.shadcn.com/create?preset=b5x0oi6GA&template=vite`
  → Tangkap area: sidebar + header + dashboard utama
- `https://ui.shadcn.com/create?preset=b5x0oi6GA&template=vite&item=preview`
  → Tangkap area: komponen-komponen individual (cards, badges, table)
- Buka dark mode dan screenshot juga (klik toggle di pojok kanan atas)

---

## Urutan Pengerjaan

```
SESI 1 → SESI 2 → SESI 3 → SESI 4 → SESI 5 → SESI 6
  ↓          ↓         ↓         ↓         ↓         ↓
Layout   Dashboard  Tabel &   Form &   Chat &   Final
cleanup  & Charts   Modal     Settings  Tiket    Polish
```

**Wajib selesaikan dan verifikasi satu sesi dulu sebelum lanjut ke sesi berikutnya.**
Jangan skip atau jalankan dua sesi sekaligus.

---

## Cara Menggunakan di Cursor AI

```
1. Buka project di Cursor
2. Tekan Ctrl+I untuk buka Agent panel
3. Pilih model: Claude Sonnet (terbaik untuk refactor)
4. Klik tombol attachment (📎) → lampirkan file-file yang diperlukan
5. Paste teks dari file SESI_X.md
6. Tambahkan kalimat ini di akhir prompt:
   "Kerjakan satu tugas sebelum lanjut ke tugas berikutnya.
    Tunjukkan perubahan apa yang akan dilakukan sebelum menerapkannya."
7. Tekan Enter — biarkan agent bekerja
8. Review perubahan yang dibuat agent sebelum di-accept
9. Test di browser
10. Setelah yakin berfungsi, lanjut ke sesi berikutnya
```

## Cara Menggunakan di GitHub Copilot

```
1. Buka VS Code dengan project
2. Buka Copilot Chat (Ctrl+Shift+I)
3. Ketik @workspace di awal pesan
4. Paste teks dari file SESI_X.md
5. Lampirkan file dengan drag & drop ke chat
6. Kirim dan review hasilnya
```

---

## Tips Penting

**✅ Lakukan ini:**
- Review setiap perubahan file sebelum di-accept
- Test di browser setelah setiap sesi selesai
- Commit ke git setelah setiap sesi berhasil (`git commit -m "Sesi X: ..."`)
- Jika ada yang rusak, gunakan `git checkout` untuk revert

**❌ Jangan lakukan ini:**
- Jangan jalankan dua sesi bersamaan
- Jangan skip verifikasi checklist di akhir setiap sesi
- Jangan biarkan agent mengubah file `api.js`, `socket.js`, atau `AuthContext.jsx`
- Jika agent mau mengubah logic fetching data, **stop dan koreksi**

---

## Ringkasan Isi Setiap Sesi

| Sesi | File | Estimasi Waktu |
|---|---|---|
| **Sesi 1** — Cleanup Layout | App.jsx, main.jsx, index.css, hapus file lama, fix i18n header | 15–30 menit |
| **Sesi 2** — Dashboard & Charts | AdminDashboard, TechnicianDashboard, UserDashboard | 30–45 menit |
| **Sesi 3** — Tabel, Modal, AlertDialog | ManageTechnicians, ManageUsers, AllTickets, modal components | 45–60 menit |
| **Sesi 4** — Form, Login, Settings | LoginPage, SignupPage, UserSettings, TechnicianSettings, SystemSettings | 30–45 menit |
| **Sesi 5** — Chat & Tiket | ChatMessage, MessageInput, TechnicianChatsPage, ChatDetailPage, CreateTicket | 45–60 menit |
| **Sesi 6** — Final Polish | Scan token invalid, konsistensi UI, empty state, verifikasi menyeluruh | 30–45 menit |

**Total estimasi: 3–5 jam** (tergantung kecepatan agent dan jumlah review)

---

## Jika Ada yang Rusak

```
# Revert satu sesi:
git checkout HEAD~1

# Atau revert file spesifik:
git checkout HEAD -- src/components/MainLayout.jsx
```

Pastikan kamu commit setelah setiap sesi berhasil agar mudah di-revert jika perlu.

