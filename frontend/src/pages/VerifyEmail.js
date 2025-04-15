import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { toast } from "react-toastify";
import { Container, Typography, CircularProgress, Box } from "@mui/material";
import { auth } from "../services/api";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current === false) {
      const verifyEmail = async () => {
        console.log("verifyEmail");
        const token = searchParams.get("token");
        if (!token) {
          setVerificationStatus("error");
          toast.error("No verification token provided");
          return;
        }

        try {
          const response = await auth.verifyEmail(token);
          if (response?.data?.status === "success") {
            setVerificationStatus("success");
            setTimeout(() => {
              navigate("/login");
            }, 2000);
          }
        } catch (error) {
          setVerificationStatus("error");
          setErrorMessage(
            error.response?.data?.message || "Verification failed"
          );
        } finally {
          setIsLoading(false);
        }
      };

      verifyEmail();
      effectRan.current = true;
    }
  }, [searchParams, navigate]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {isLoading ? (
          <>
            <CircularProgress />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Verifying your email...
            </Typography>
          </>
        ) : verificationStatus === "success" ? (
          <Typography variant="h5" color="success.main">
            Email verified successfully! Redirecting to login...
          </Typography>
        ) : (
          <Typography variant="h5" color="error.main">
            {errorMessage}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default VerifyEmail;
