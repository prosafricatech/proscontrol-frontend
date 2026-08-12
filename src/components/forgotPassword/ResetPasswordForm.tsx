'use client';

import { LoadingButton } from "@mui/lab";
import { Card, CardContent, Typography, TextField, Box as Div, Link } from "@mui/material";
import { useSnackbar } from "notistack";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FC } from "react";
import * as yup from "yup";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ASSET_IMAGES } from "@/utilities/constants/paths";

interface ResetPasswordFormValues {
  email: string;
  password: string;
  password_confirmation: string;
}

interface ResetPasswordPayload extends ResetPasswordFormValues {
  token: string;
}

const ResetPasswordForm: FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const params = useParams<{ lang?: string }>();
  const searchParams = useSearchParams();
  const lang = params?.lang || 'en-US';
  const token = (searchParams.get('token') || '').trim();

  const validationSchema = yup.object({
    email: yup
      .string()
      .email('Enter a valid email')
      .required('Email is required'),
    password: yup
      .string()
      .required('Password is required')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/,
        "Must contain atleast 8 Characters, 1 Uppercase, 1 Lowercase, 1 Number and 1 Special character"
      ),
    password_confirmation: yup
      .string()
      .required('Password confirmation is required')
      .oneOf([yup.ref("password")], 'Password does not match')
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      email: '',
      password: '',
      password_confirmation: '',
    },
  });

  const resetPassword = async (data: ResetPasswordPayload): Promise<void> => {
    try {
      const response = await axios.post('/api/auth/reset-password', data);

      if (response.status === 200) {
        enqueueSnackbar(response.data.message, {
          variant: 'success'
        });
        router.push(`/${lang}/auth/signin`);
      }
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || 'An error occurred', {
        variant: 'error'
      });
      throw err;
    }
  };

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      enqueueSnackbar('Password reset token is missing or invalid.', {
        variant: 'error'
      });
      return;
    }

    await resetPassword({ ...data, token });
  };

  return (
    <Div sx={{
      flex: 1,
      flexWrap: 'wrap',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      p: theme => theme.spacing(4),
    }}>
      <Div sx={{ mb: 3, display: 'inline-flex' }}>
        <Link href="/" underline="none" sx={{ display: 'inline-flex' }}>
          <img width={200} src={`${ASSET_IMAGES}/proserp-blue.png`} alt="ProsERP" />
        </Link>
      </Div>
      <Card sx={{ maxWidth: '100%', width: 360, mb: 4 }}>
        <CardContent>
          <Typography textAlign={'center'} sx={{ mb: 2 }} variant={'h4'}>
            Create your new Password
          </Typography>
          <Div sx={{ mb: 3, mt: 1 }}>
            <form onSubmit={handleSubmit(onSubmit)} style={{ textAlign: 'left' }} noValidate autoComplete='off'>
              <Div sx={{ mt: 1, mb: 3 }}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Div>
              <Div sx={{ mt: 1, mb: 2 }}>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="New Password"
                      type="password"
                      error={!!errors.password}
                      helperText={errors.password?.message}
                    />
                  )}
                />
              </Div>
              <Div sx={{ mt: 1, mb: 2 }}>
                <Controller
                  name="password_confirmation"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Confirm Password"
                      type="password"
                      error={!!errors.password_confirmation}
                      helperText={errors.password_confirmation?.message}
                    />
                  )}
                />
              </Div>
              <LoadingButton
                fullWidth
                type='submit'
                variant="contained"
                sx={{ mb: 2 }}
                loading={isSubmitting}
                disabled={!token}
              >
                Reset Password
              </LoadingButton>
            </form>
          </Div>
          <Typography textAlign={"center"} variant={"body1"} mb={1}>
            Have the password? <Link color={"inherit"} underline="none" href={`/${lang}/auth/signin`}>Proceed to Sign In</Link>
          </Typography>
          <Typography textAlign={"center"} variant={"body1"} mb={1}>
            Don't remember your email? <Link underline="none" href="#">Contact Support</Link>
          </Typography>
        </CardContent>
      </Card>
    </Div>
  );
}
export default ResetPasswordForm;