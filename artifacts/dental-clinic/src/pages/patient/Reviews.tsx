import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useListReviews, useCreateReview, useListServices } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { format } from "date-fns";

const reviewSchema = z.object({
  serviceId: z.string().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

function StarRating({ value, onChange }: { value: number, onChange: (val: number) => void }) {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          className="p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >
          <Star 
            className={`w-8 h-8 transition-colors ${
              star <= (hover || value) ? "fill-primary text-primary" : "text-muted border-muted"
            }`} 
          />
        </button>
      ))}
    </div>
  );
}

export default function PatientReviews() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const { toast } = useToast();
  const { data: services } = useListServices();
  const { data: reviews, refetch } = useListReviews();
  const createReview = useCreateReview();

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      serviceId: "",
      rating: 5,
      comment: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof reviewSchema>) => {
    try {
      await createReview.mutateAsync({
        data: {
          serviceId: values.serviceId ? Number(values.serviceId) : undefined,
          rating: values.rating,
          comment: values.comment,
        }
      });
      toast({ title: "Review submitted successfully" });
      form.reset({ rating: 5, comment: "", serviceId: "" });
      refetch();
    } catch (error: any) {
      toast({ title: "Failed to submit review", description: error.message, variant: "destructive" });
    }
  };

  const myReviews = reviews?.filter(r => r.patientId === user?.id) || [];

  return (
    <DashboardLayout allowedRoles={["patient"]}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
            <CardDescription>Share your experience with us to help us improve.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <FormControl>
                        <StarRating value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services?.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {language === 'ar' ? s.nameAr : s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comment</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about your experience..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={createReview.isPending}>
                  {createReview.isPending ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {myReviews.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mt-10">My Past Reviews</h2>
            <div className="grid gap-4">
              {myReviews.map(review => (
                <Card key={review.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-4 h-4 ${star <= review.rating ? "fill-primary text-primary" : "text-muted"}`} 
                            />
                          ))}
                        </div>
                        {review.serviceName && (
                          <CardDescription>{review.serviceName}</CardDescription>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(review.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
