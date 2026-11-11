package com.simklinik.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.simklinik.mobile.data.model.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SIMKlinikApp()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SIMKlinikApp() {
    // Current authenticated state
    var currentToken by remember { mutableStateOf<String?>(null) }
    var currentUser by remember { mutableStateOf<User?>(null) }
    var currentScreen by remember { mutableStateOf("login") }
    var selectedQueueItem by remember { mutableStateOf<VisitQueue?>(null) }

    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = Color(0xFF0D9488), // Teal-600
            secondary = Color(0xFF0284C7), // Sky-600
            background = Color(0xFFF8FAFC),
            surface = Color.White
        )
    ) {
        Surface(modifier = Modifier.fillMaxSize()) {
            if (currentToken == null || currentUser == null) {
                AndroidLoginScreen(
                    onLoginSuccess = { user, token ->
                        currentUser = user
                        currentToken = token
                        currentScreen = "dashboard"
                    }
                )
            } else {
                Scaffold(
                    topBar = {
                        TopAppBar(
                            title = {
                                Column {
                                    Text("SIM Klinik Native", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                                    Text(
                                        "${currentUser?.nama} (${currentUser?.role})",
                                        fontSize = 12.sp,
                                        color = Color.DarkGray
                                    )
                                }
                            },
                            actions = {
                                IconButton(onClick = {
                                    currentToken = null
                                    currentUser = null
                                    currentScreen = "login"
                                }) {
                                    Icon(Icons.Default.ExitToApp, contentDescription = "Keluar")
                                }
                            },
                            colors = TopAppBarDefaults.topAppBarColors(
                                containerColor = Color(0xFF0D9488),
                                titleContentColor = Color.White,
                                actionIconContentColor = Color.White
                            )
                        )
                    },
                    bottomBar = {
                        NavigationBar(containerColor = Color.White) {
                            NavigationBarItem(
                                selected = currentScreen == "dashboard",
                                onClick = { currentScreen = "dashboard" },
                                icon = { Icon(Icons.Default.Home, contentDescription = "Dashboard") },
                                label = { Text("Dashboard") }
                            )
                            NavigationBarItem(
                                selected = currentScreen == "antrean",
                                onClick = { currentScreen = "antrean" },
                                icon = { Icon(Icons.Default.People, contentDescription = "Antrean") },
                                label = { Text("Antrean") }
                            )
                            if (currentUser?.role == "Dokter") {
                                NavigationBarItem(
                                    selected = currentScreen == "periksa",
                                    onClick = { currentScreen = "periksa" },
                                    icon = { Icon(Icons.Default.MedicalServices, contentDescription = "Pemeriksaan") },
                                    label = { Text("Periksa") }
                                )
                            }
                            NavigationBarItem(
                                selected = currentScreen == "pasien",
                                onClick = { currentScreen = "pasien" },
                                icon = { Icon(Icons.Default.PersonSearch, contentDescription = "Pasien") },
                                label = { Text("Pasien") }
                            )
                        }
                    }
                ) { innerPadding ->
                    Box(modifier = Modifier.padding(innerPadding)) {
                        when (currentScreen) {
                            "dashboard" -> AndroidDashboardScreen(
                                user = currentUser!!,
                                onNavigateToAntrean = { currentScreen = "antrean" }
                            )
                            "antrean" -> AndroidQueueScreen(
                                user = currentUser!!,
                                onSelectPatientToExamine = { queue ->
                                    selectedQueueItem = queue
                                    currentScreen = "periksa"
                                }
                            )
                            "periksa" -> AndroidExaminationScreen(
                                user = currentUser!!,
                                queueItem = selectedQueueItem,
                                onFinished = {
                                    selectedQueueItem = null
                                    currentScreen = "antrean"
                                }
                            )
                            "pasien" -> AndroidPatientScreen()
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AndroidLoginScreen(onLoginSuccess: (User, String) -> Unit) {
    var username by remember { mutableStateOf("dokter1") }
    var password by remember { mutableStateOf("dokter123") }
    var isSubmitting by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            Icons.Default.LocalHospital,
            contentDescription = "Logo",
            tint = Color(0xFF0D9488),
            modifier = Modifier.size(64.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text("SIM Klinik Android", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        Text("Aplikasi Khusus Dokter & Tenaga Medis", fontSize = 14.sp, color = Color.Gray)
        Spacer(modifier = Modifier.height(32.dp))

        OutlinedTextField(
            value = username,
            onValueChange = { username = it },
            label = { Text("Username") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                onLoginSuccess(
                    User("usr_dok1", username, "dr. Hendra Prasetya, Sp.PD", "Dokter", "446.1/042/SIP-D/2024"),
                    "sim_token_demo"
                )
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0D9488))
        ) {
            Text("Masuk ke Sistem", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun AndroidDashboardScreen(user: User, onNavigateToAntrean: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFCCFBF1))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Selamat Datang di SIM Klinik", fontWeight = FontWeight.Bold, color = Color(0xFF115E59))
                Text("Semua data terhubung langsung ke database pusat online", fontSize = 13.sp, color = Color(0xFF134E4A))
            }
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text("Status Ringkas", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        Spacer(modifier = Modifier.height(8.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Card(modifier = Modifier.weight(1f)) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("Antrean", fontSize = 12.sp, color = Color.Gray)
                    Text("Aktif", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0D9488))
                }
            }
            Card(modifier = Modifier.weight(1f)) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("Poli", fontSize = 12.sp, color = Color.Gray)
                    Text("Umum", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0284C7))
                }
            }
        }
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = onNavigateToAntrean,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0D9488))
        ) {
            Text("Buka Daftar Antrean Pasien")
        }
    }
}

@Composable
fun AndroidQueueScreen(user: User, onSelectPatientToExamine: (VisitQueue) -> Unit) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Antrean Pasien Hari Ini", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        Text("Sinkronisasi otomatis dengan loket pendaftaran", fontSize = 12.sp, color = Color.Gray)
        Spacer(modifier = Modifier.height(12.dp))

        Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("A-001", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color(0xFF0D9488))
                    Text("Pasien Menunggu Dokter", fontWeight = FontWeight.Medium)
                    Text("Poli Umum", fontSize = 12.sp, color = Color.Gray)
                }
                if (user.role == "Dokter") {
                    Button(
                        onClick = {
                            onSelectPatientToExamine(
                                VisitQueue(
                                    id = "kunj_demo",
                                    pasienId = "pas_demo",
                                    noRM = "RM-202611-0001",
                                    namaPasien = "Pasien Antrean",
                                    tanggal = "2026-11-08",
                                    waktuDaftar = "2026-11-08T08:00:00Z",
                                    noAntrean = "A-001",
                                    jenisKunjungan = "Lama",
                                    poli = "Poli Umum",
                                    dokterId = user.id,
                                    namaDokter = user.nama,
                                    status = "Menunggu",
                                    keluhanAwal = "Demam dan batuk"
                                )
                            )
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0D9488))
                    ) {
                        Text("Periksa")
                    }
                }
            }
        }
    }
}

@Composable
fun AndroidExaminationScreen(user: User, queueItem: VisitQueue?, onFinished: () -> Unit) {
    var keluhanUtama by remember { mutableStateOf(queueItem?.keluhanAwal ?: "") }
    var tekananDarah by remember { mutableStateOf("120/80") }
    var suhuTubuh by remember { mutableStateOf("36.5") }
    var beratBadan by remember { mutableStateOf("60") }
    var tinggiBadan by remember { mutableStateOf("165") }
    var diagnosis by remember { mutableStateOf("") }
    var resepObat by remember { mutableStateOf("") }

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        item {
            Text("Pemeriksaan Dokter (Rekam Medis)", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text(
                "Pasien: ${queueItem?.namaPasien ?: "Pilih dari Antrean"} (${queueItem?.noRM ?: "-"})",
                color = Color(0xFF0D9488),
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = keluhanUtama,
                onValueChange = { keluhanUtama = it },
                label = { Text("Anamnesis / Keluhan Utama") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(12.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = tekananDarah,
                    onValueChange = { tekananDarah = it },
                    label = { Text("TD (mmHg)") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = suhuTubuh,
                    onValueChange = { suhuTubuh = it },
                    label = { Text("Suhu (°C)") },
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = beratBadan,
                    onValueChange = { beratBadan = it },
                    label = { Text("BB (kg)") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = tinggiBadan,
                    onValueChange = { tinggiBadan = it },
                    label = { Text("TB (cm)") },
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = diagnosis,
                onValueChange = { diagnosis = it },
                label = { Text("Diagnosis Medis") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = resepObat,
                onValueChange = { resepObat = it },
                label = { Text("Resep Dokter (Elektronik ke Farmasi)") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(20.dp))

            Button(
                onClick = onFinished,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0D9488))
            ) {
                Text("Simpan & Sahkan Rekam Medis")
            }
        }
    }
}

@Composable
fun AndroidPatientScreen() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Daftar Pasien Terdaftar", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        Text("Pencarian cepat berdasarkan Nama atau No. Rekam Medis", fontSize = 12.sp, color = Color.Gray)
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = "",
            onValueChange = {},
            label = { Text("Cari Pasien / No. RM...") },
            modifier = Modifier.fillMaxWidth()
        )
    }
}
