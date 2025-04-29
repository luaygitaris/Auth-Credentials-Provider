'use server';

import { RegisterSchema, SignInSchema } from './zod';
import { hashSync } from 'bcrypt-ts';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import AuthError from 'next-auth';

export const signupCredentials = async (
	prevState: unknown,
	formData: FormData
) => {
	const validatedFields = RegisterSchema.safeParse(
		Object.fromEntries(formData.entries())
	);

	if (!validatedFields.success) {
		return {
			error: validatedFields.error.flatten().fieldErrors,
		};
	}

	const { name, email, password } = validatedFields.data;
	const hashedPassword = hashSync(password, 10);

	try {
		await prisma.user.create({
			data: {
				name,
				email,
				hashedPassword,
			},
		});
	} catch (error) {
		return { message: 'Failed to Register User!', error: error };
	}
	redirect('/login');
};

// sign in credential action
// export const signInCredentials = async (
// 	prevState: unknown,
// 	formData: FormData
// ) => {
// 	const validatedFields = SignInSchema.safeParse(
// 		Object.fromEntries(formData.entries())
// 	);

// 	if (!validatedFields.success) {
// 		return {
// 			error: validatedFields.error.flatten().fieldErrors,
// 		};
// 	}

// 	const { email, password } = validatedFields.data;

// 	try {
// 		await signIn('credentials', { email, password, redirectTo: '/dashboard' });
// 	} catch (error) {
// 		if (error instanceof AuthError) {
// 			switch (error.type) {
// 				case 'CredentialsSignin':
// 					return { message: 'Invalid Credentials.' };

// 				default:
// 					return { message: 'Something went wrong.' };
// 			}
// 		}
// 		throw error;
// 	}
// };



export const signInCredentials = async (
  prevState: unknown,
  formData: FormData
) => {
  // Validasi menggunakan Zod schema
  const validatedFields = SignInSchema.safeParse(Object.fromEntries(formData.entries()));

  // Jika validasi gagal, kembalikan error
  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  try {
    // Melakukan signIn menggunakan kredensial
    const result = await signIn("credentials", { email, password, redirect: false });

    // Jika error (misalnya, kredensial salah), kembalikan error
    if (result?.error) {
      return { error: { email: ['Invalid credentials'] } };
    }

    // Jika login berhasil, kembalikan sukses
    return { message: "Successfully logged in" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: { email: ['Invalid credentials'] } };
        default:
          return { error: { email: ['Something went wrong. Please try again.'] } };
      }
    }
    throw error; // Lempar error lainnya
  }
};

