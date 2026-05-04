Tanggal: 2026-04-18

> Jalankan setelah Sesi 4 selesai dan diverifikasi
> Fokus: UI chat (ScrollArea, bubble), halaman tiket, dan ticket detail

---

## KONTEKS

Project: Helpdesk System — React 18 + Vite + shadcn/ui + Socket.io.
Sesi 1–4 sudah selesai. Socket.io sudah terhubung di `src/lib/socket.js`.

---

## YANG TIDAK BOLEH DIUBAH

```
❌ Semua socket event handlers (socket.on, socket.emit, socket.connect, dll)
❌ Semua api.get/post/patch/delete calls
❌ Semua state, useEffect, ref (messagesEndRef, activeChatIdRef, dll)
❌ Logic scroll to bottom
❌ src/lib/api.js, socket.js, AuthContext.jsx
❌ src/components/ui/
```

---

## TUGAS SESI INI

### TUGAS 1 — `src/components/ChatMessage.jsx`

Komponen ini sudah cukup baik. Perbaikan kecil:

#### 1A. Ganti `bg-surface` (tidak ada di theme baru) dengan token yang valid

```jsx
// SEBELUM:
className="bg-surface border border-border text-foreground rounded-tl-sm"

// SESUDAH:
className="bg-muted border border-border text-foreground rounded-tl-sm"
```

#### 1B. Pastikan read receipt icon konsisten

```jsx
// Pastikan import CheckCheck ada:
import { CheckCheck } from 'lucide-react';

// Read receipt sudah benar, hanya pastikan warna sesuai theme:
<CheckCheck
  className={cn(
    "h-3.5 w-3.5 ml-1",
    message.is_read
      ? "text-primary-foreground/90"   // biru saat sudah dibaca (di bubble primary)
      : "text-primary-foreground/50"   // abu saat belum dibaca
  )}
/>
```

---

### TUGAS 2 — `src/components/MessageInput.jsx`

Baca file ini terlebih dahulu, lalu rapikan UI-nya:

```jsx
// Target tampilan MessageInput:
<div className="flex items-end gap-2 p-4 border-t bg-background">
  <Textarea
    placeholder="Ketik pesan..."
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    onKeyDown={handleKeyDown}
    disabled={disabled}
    rows={1}
    className="min-h-[40px] max-h-[120px] resize-none flex-1"
  />
  <Button
    size="icon"
    onClick={handleSend}
    disabled={disabled || !message.trim()}
    className="h-10 w-10 shrink-0"
  >
    <Send className="h-4 w-4" />
    <span className="sr-only">Kirim pesan</span>
  </Button>
</div>
```

Import yang dibutuhkan:
```jsx
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
```

Pertahankan semua props, state, dan handler yang sudah ada.

---

### TUGAS 3 — `src/pages/technician/TechnicianChatsPage.jsx`

Halaman ini sudah punya layout dua panel (list kiri + chat kanan). Rapikan:

#### 3A. Bungkus daftar pesan dengan `ScrollArea`

```jsx
import { ScrollArea } from '@/components/ui/scroll-area';

// Bungkus container messages:
<ScrollArea className="flex-1 p-4">
  <div className="space-y-1">
    {messages.map((msg) => (
      <ChatMessage
        key={msg.id}
        message={msg}
        isOwnMessage={msg.sender_id === currentUser?.id}
      />
    ))}
    <div ref={messagesEndRef} />
  </div>
</ScrollArea>
```

#### 3B. Rapikan panel list chat (kiri)

```jsx
// Header panel kiri:
<div className="flex flex-col h-full border-r">
  <div className="p-4 border-b">
    <h2 className="font-semibold text-sm">Percakapan</h2>
    <div className="relative mt-2">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Cari percakapan..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-9 h-8 text-sm"
      />
    </div>
  </div>
  <ScrollArea className="flex-1">
    {/* list chat items */}
  </ScrollArea>
</div>
```

#### 3C. Rapikan item chat di list

```jsx
// Setiap item chat di list:
<button
  key={chat.id}
  onClick={() => handleSelectChat(chat.id)}
  className={cn(
    "w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors",
    activeChatId === chat.id && "bg-muted"
  )}
>
  <Avatar className="h-9 w-9 shrink-0">
    <AvatarFallback className="text-xs bg-primary/10 text-primary">
      {chat.user_name?.charAt(0)?.toUpperCase() || 'U'}
    </AvatarFallback>
  </Avatar>
  <div className="flex-1 min-w-0">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium truncate">{chat.user_name}</span>
      <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
        {formatChatTime(chat.last_message_at)}
      </span>
    </div>
    <p className="text-xs text-muted-foreground truncate mt-0.5">
      {chat.last_message || 'Belum ada pesan'}
    </p>
  </div>
  {chat.unread_count > 0 && (
    <Badge className="shrink-0 h-5 min-w-5 px-1 text-[10px]">
      {chat.unread_count}
    </Badge>
  )}
</button>
```

Pertahankan semua socket handlers, fetch logic, dan ref.

---

### TUGAS 4 — `src/pages/ChatDetailPage.jsx` dan `src/pages/ChatListPage.jsx`

Terapkan pola yang sama dengan TechnicianChatsPage:
- `ScrollArea` untuk container pesan
- Search bar dengan icon di chat list
- Avatar untuk item chat
- Pertahankan semua socket event dan api calls

---

### TUGAS 5 — `src/pages/UserTicketsPage.jsx` dan halaman tiket lainnya

Rapikan tabel tiket:

```jsx
<div className="space-y-4">
  {/* Header */}
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Tiket Saya</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Daftar semua tiket yang kamu buat
      </p>
    </div>
    <Button asChild>
      <Link to="/user/create-ticket">
        <PlusCircle className="mr-2 h-4 w-4" />
        Buat Tiket Baru
      </Link>
    </Button>
  </div>

  {/* Tabel dalam Card */}
  <Card>
    <CardContent className="p-0">
      <Table>
        {/* tabel yang sudah ada */}
      </Table>
    </CardContent>
  </Card>
</div>
```

---

### TUGAS 6 — `src/pages/CreateTicketPage.jsx`

Bungkus form dalam Card dengan layout yang rapi:

```jsx
<div className="max-w-2xl mx-auto space-y-6">
  <div>
    <h1 className="text-2xl font-bold tracking-tight">Buat Tiket Baru</h1>
    <p className="text-sm text-muted-foreground mt-1">
      Laporkan masalah IT Anda
    </p>
  </div>

  <Card>
    <CardHeader>
      <CardTitle className="text-base">Detail Laporan</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* semua form fields yang sudah ada */}
    </CardContent>
    <CardFooter className="border-t pt-6 flex justify-end gap-3">
      <Button variant="outline" type="button" onClick={() => navigate(-1)}>
        Batal
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Kirim Tiket
      </Button>
    </CardFooter>
  </Card>
</div>
```

Pertahankan semua form state dan submit handler.

---

## VERIFIKASI SETELAH SELESAI

- [ ] Chat bubble tampil dengan benar (sent kanan, received kiri)
- [ ] ScrollArea berfungsi di container pesan (tidak overflow)
- [ ] Auto-scroll ke bawah saat pesan baru masuk masih berfungsi
- [ ] Search di chat list berfungsi
- [ ] Socket realtime (pesan baru, read receipt) masih berfungsi
- [ ] Tabel tiket tampil dalam Card
- [ ] Form buat tiket dalam Card, submit berfungsi
- [ ] `bg-surface` tidak ada lagi (ganti dengan `bg-muted` atau `bg-card`)

