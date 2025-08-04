"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Apple, AlertCircle, Shield } from "lucide-react"
import { GUEST_CHECKOUT_LIMITS } from "@/lib/cdp-auth"

interface GuestCheckoutProps {
  onStartGuestCheckout: (paymentMethod: "CARD" | "APPLE_PAY") => void
  estimatedUSDAmount: number
  isLoading?: boolean
}

export function GuestCheckout({ 
  onStartGuestCheckout, 
  estimatedUSDAmount,
  isLoading = false 
}: GuestCheckoutProps) {
  const isWithinLimits = estimatedUSDAmount >= GUEST_CHECKOUT_LIMITS.minimumAmount && 
                        estimatedUSDAmount <= GUEST_CHECKOUT_LIMITS.weeklyLimit

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Guest Checkout
        </CardTitle>
        <CardDescription>
          No Coinbase account needed. Pay with your debit card.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Guest checkout limits:</p>
              <ul className="mt-1 space-y-1">
                <li>• ${GUEST_CHECKOUT_LIMITS.minimumAmount} minimum purchase</li>
                <li>• ${GUEST_CHECKOUT_LIMITS.weeklyLimit} maximum per week</li>
                <li>• US residents only</li>
              </ul>
            </div>
          </div>
        </div>

        {!isWithinLimits && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                {estimatedUSDAmount < GUEST_CHECKOUT_LIMITS.minimumAmount ? (
                  <p>Amount too low. Minimum is ${GUEST_CHECKOUT_LIMITS.minimumAmount}.</p>
                ) : (
                  <p>Amount too high. Maximum is ${GUEST_CHECKOUT_LIMITS.weeklyLimit} per week.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="text-center text-sm text-gray-600">
            Purchase ${estimatedUSDAmount.toFixed(2)} in USDC
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => onStartGuestCheckout("CARD")}
              disabled={!isWithinLimits || isLoading}
              className="w-full flex items-center gap-2"
              variant="default"
            >
              <CreditCard className="h-4 w-4" />
              {isLoading ? "Loading..." : "Pay with Debit Card"}
            </Button>

            <Button
              onClick={() => onStartGuestCheckout("APPLE_PAY")}
              disabled={!isWithinLimits || isLoading}
              className="w-full flex items-center gap-2 bg-black hover:bg-gray-800 text-white"
              variant="secondary"
            >
              <Apple className="h-4 w-4" />
              {isLoading ? "Loading..." : "Pay with Apple Pay"}
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Transactions are processed securely by Coinbase
        </div>
      </CardContent>
    </Card>
  )
}

export default GuestCheckout