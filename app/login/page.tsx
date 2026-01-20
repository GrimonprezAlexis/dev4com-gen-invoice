"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { resetPassword } from "@/lib/firebase-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Lock, Mail, UserPlus, LogIn, ArrowLeft, KeyRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (password !== confirmPassword) {
          setError("Les mots de passe ne correspondent pas");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Le mot de passe doit contenir au moins 6 caractères");
          setLoading(false);
          return;
        }
        await register(email, password);
      }
      router.push("/");
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/user-not-found") {
        setError("Aucun compte trouvé avec cet email");
      } else if (err.code === "auth/wrong-password") {
        setError("Mot de passe incorrect");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Cet email est déjà utilisé");
      } else if (err.code === "auth/invalid-email") {
        setError("Email invalide");
      } else if (err.code === "auth/invalid-credential") {
        setError("Email ou mot de passe incorrect");
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError("Veuillez entrer votre adresse email");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email);
      setSuccessMessage("Un email de réinitialisation a été envoyé à votre adresse email.");
    } catch (err: any) {
      console.error("Reset password error:", err);
      if (err.code === "auth/user-not-found") {
        setError("Aucun compte trouvé avec cet email");
      } else if (err.code === "auth/invalid-email") {
        setError("Email invalide");
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Dev4Ecom</h1>
          <p className="text-slate-400 mt-2">Gestion de devis et factures</p>
        </div>

        {/* Card */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-8">
          {isForgotPassword ? (
            /* Forgot Password Form */
            <>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la connexion
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600/20 rounded-full mb-4">
                  <KeyRound className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Mot de passe oublié</h2>
                <p className="text-slate-400 text-sm mt-2">
                  Entrez votre email pour recevoir un lien de réinitialisation
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail" className="text-slate-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-12 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-sm">{successMessage}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Envoyer le lien
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            /* Login/Register Form */
            <>
              <div className="flex mb-6">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 text-sm font-medium rounded-l-lg transition-all ${
                    isLogin
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  <LogIn className="w-4 h-4 inline-block mr-2" />
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 text-sm font-medium rounded-r-lg transition-all ${
                    !isLogin
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  <UserPlus className="w-4 h-4 inline-block mr-2" />
                  Inscription
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-12 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 h-12 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-300">
                      Confirmer le mot de passe
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="pl-10 h-12 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isLogin ? "Connexion..." : "Création du compte..."}
                    </>
                  ) : (
                    <>
                      {isLogin ? (
                        <>
                          <LogIn className="w-5 h-5 mr-2" />
                          Se connecter
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5 mr-2" />
                          Créer un compte
                        </>
                      )}
                    </>
                  )}
                </Button>
              </form>

              {isLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError(null);
                  }}
                  className="w-full text-center text-sm text-slate-400 hover:text-blue-400 mt-4 transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              )}

              {!isLogin && (
                <p className="text-xs text-slate-500 text-center mt-4">
                  En créant un compte, les données existantes seront automatiquement associées à votre compte.
                </p>
              )}
            </>
          )}
        </Card>

        <p className="text-center text-slate-500 text-sm mt-6">
          © 2024 Dev4Ecom. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
