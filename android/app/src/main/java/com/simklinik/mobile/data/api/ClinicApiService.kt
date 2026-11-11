package com.simklinik.mobile.data.api

import com.simklinik.mobile.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ClinicApiService {

    @POST("auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    @GET("dashboard/summary")
    suspend fun getDashboardSummary(
        @Header("Authorization") token: String
    ): Response<ApiResponse<DashboardSummary>>

    @GET("kunjungans")
    suspend fun getQueueList(
        @Header("Authorization") token: String,
        @Query("tanggal") tanggal: String? = null,
        @Query("status") status: String? = null
    ): Response<ApiResponse<List<VisitQueue>>>

    @PATCH("kunjungans/{id}/status")
    suspend fun updateQueueStatus(
        @Header("Authorization") token: String,
        @Path("id") kunjunganId: String,
        @Body body: Map<String, String>
    ): Response<ApiResponse<VisitQueue>>

    @GET("pasiens")
    suspend fun getPatients(
        @Header("Authorization") token: String,
        @Query("search") search: String? = null
    ): Response<ApiResponse<List<Patient>>>

    @POST("pasiens")
    suspend fun createPatient(
        @Header("Authorization") token: String,
        @Body patient: Patient
    ): Response<ApiResponse<Patient>>

    @POST("rekam-medis")
    suspend fun saveMedicalRecord(
        @Header("Authorization") token: String,
        @Body record: SaveMedicalRecordRequest
    ): Response<ApiResponse<Any>>

    @GET("obats")
    suspend fun getMedicines(
        @Header("Authorization") token: String,
        @Query("search") search: String? = null
    ): Response<ApiResponse<List<ObatSimple>>>
}
