"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface CalibrateSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  calType: "SAT" | "ZERO" | null;
  calValue: number;
  o2Pct: number;
  o2Mgl: number;
  temp: number;
  timestamp: string;
}

export function CalibrateSuccess({
  isOpen,
  onClose,
  calType,
  calValue,
  o2Pct,
  o2Mgl,
  temp,
  timestamp,
}: CalibrateSuccessProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn(
              "relative m-4 w-full max-w-2xl overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-lg"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">

              {/* ซ้าย — Success */}
              <div className="flex flex-col items-center justify-center gap-4 p-10 text-center bg-background/50">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, transition: { delay: 0.2, type: "spring", stiffness: 200, damping: 15 } }}
                >
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </motion.div>
                <h2 className="text-2xl font-semibold">Calibrate สำเร็จ!</h2>
                <p className="text-sm text-muted-foreground">
                  ค่า {calType === 'SAT' ? 'SAT 100%' : 'ZERO 0%'} ถูกบันทึกเรียบร้อยแล้ว
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 w-full max-w-xs py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Got It
                </button>
              </div>

              {/* ขวา — รายละเอียด */}
              <div className="relative p-8">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                <h3 className="text-lg font-semibold mb-6">ผลการ Calibrate</h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">ประเภท</p>
                    <p className="font-medium">{calType === 'SAT' ? 'SAT 100%' : 'ZERO 0%'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">เวลา</p>
                    <p className="font-medium">{timestamp}</p>
                  </div>
                </div>

                <Separator className="my-5" />

                <div className="space-y-3">
                  {[
                    { label: 'ค่าที่ได้ (Calibrate)', value: `${Number(calValue).toFixed(1)}${calType === 'SAT' ? ' %' : ' mg/L'}` },
                    { label: 'O2 (%)', value: `${Number(o2Pct).toFixed(1)} %` },
                    { label: 'O2 (mg/L)', value: `${Number(o2Mgl).toFixed(1)} mg/L` },
                    { label: 'อุณหภูมิน้ำ', value: `${Number(temp).toFixed(1)} °C` },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex justify-between items-center text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: 0.3 + i * 0.1 } }}
                    >
                      <p className="text-muted-foreground">{item.label}</p>
                      <p className="font-mono font-medium">{item.value}</p>
                    </motion.div>
                  ))}
                </div>

                <Separator className="my-5" />

                <motion.div
                  className="flex justify-between items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.8 } }}
                >
                  <p className="font-semibold">สถานะ</p>
                  <p className="text-green-600 font-bold">✅ ผ่าน</p>
                </motion.div>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}