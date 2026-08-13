'use client';

import { ASSET_IMAGES } from '@/utilities/constants/paths';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import { Card, CardContent, Link, Typography } from '@mui/material';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const VerifyPassword = () => {
  const router = useRouter();
  const params = useParams<{ lang?: string }>();
  const searchParams = useSearchParams();
  const lang = params?.lang || 'en-US';
  const signature = (searchParams.get('signature') || '').trim();

  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (signature) {
      console.log('signature: ', signature);
      setIsVerifying(true);
    } else {
      setIsVerifying(false);
    }
  }, [signature]);

  return (
    <Div
      sx={{
        flex: 1,
        flexWrap: 'wrap',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: (theme) => theme.spacing(4),
      }}
    >
      <Div sx={{ mb: 3, display: 'inline-flex' }}>
        <img
          width={200}
          src={`${ASSET_IMAGES}/logos/proserp-blue.png`}
          alt='ProsERP'
        />
      </Div>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent>
          <LoadingButton
            // onClick={handleSubmit}
            loading={isVerifying}
            fullWidth
            variant='contained'
            size='large'
            sx={{ mb: 3 }}
          >
            {isVerifying ? 'Verifying Email' : 'Verify Email'}
          </LoadingButton>

          <Typography align='center' variant='body2' mb={1}>
            Have the password?{' '}
            <Link
              href='/auth/signin'
              style={{ color: '#0267a0', fontWeight: 600 }}
            >
              Proceed to Sign In
            </Link>
          </Typography>

          <Typography align='center' variant='body2'>
            Don’t remember your email?{' '}
            <Link href='/support' style={{ color: '#00a8ff' }}>
              Contact Support
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Div>
  );
};

export default VerifyPassword;
