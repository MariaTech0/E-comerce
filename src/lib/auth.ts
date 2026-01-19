import { supabase } from './supabase';

export const signUp = async (email: string, password: string, fullName: string) => {
  try {
    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Erro ao criar usuário');

    // 2. Criar perfil do usuário (role padrão: customer)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        role: 'customer',
        force_password_change: false,
      });

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      // Não lançar erro aqui, pois o usuário já foi criado
    }

    return { success: true, user: authData.user };
  } catch (error: any) {
    console.error('Erro no signUp:', error);
    throw new Error(error.message || 'Erro ao criar conta');
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Erro ao fazer login');

    return { success: true, user: data.user, session: data.session };
  } catch (error: any) {
    console.error('Erro no signIn:', error);
    throw new Error(error.message || 'Erro ao fazer login');
  }
};

export const checkAdminAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { isAdmin: false, user: null, profile: null };
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !profile) {
      return { isAdmin: false, user: session.user, profile: null };
    }

    const isAdmin = ['superadmin', 'editor', 'support'].includes(profile.role);
    
    return { 
      isAdmin, 
      user: session.user, 
      profile,
      needsPasswordChange: profile.force_password_change 
    };
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return { isAdmin: false, user: null, profile: null };
  }
};

export const requireAdmin = async (navigate: any, currentPath: string) => {
  const { isAdmin, profile, needsPasswordChange } = await checkAdminAuth();
  
  if (!isAdmin) {
    navigate('/login?redirect=' + currentPath);
    return false;
  }

  if (needsPasswordChange && currentPath !== '/change-password') {
    navigate('/change-password');
    return false;
  }

  return true;
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    // Atualizar flag de troca de senha forçada
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_profiles')
        .update({ force_password_change: false })
        .eq('id', user.id);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar senha:', error);
    throw new Error(error.message || 'Erro ao atualizar senha');
  }
};
