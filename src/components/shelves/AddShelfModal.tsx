import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useShelves } from '@/hooks/useShelves';
import { useStores } from '@/hooks/useStores';
import { Loader2 } from 'lucide-react';

const shelfSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  store_id: z.string().optional(),
  description: z.string().optional(),
  location_in_store: z.string().optional(),
});

type ShelfFormData = z.infer<typeof shelfSchema>;

interface AddShelfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddShelfModal({ open, onOpenChange }: AddShelfModalProps) {
  const { createShelf } = useShelves();
  const { stores } = useStores();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ShelfFormData>({
    resolver: zodResolver(shelfSchema),
    defaultValues: {
      name: '',
      store_id: '',
      description: '',
      location_in_store: '',
    },
  });

  const onSubmit = async (data: ShelfFormData) => {
    setIsSubmitting(true);
    try {
      await createShelf.mutateAsync({
        name: data.name,
        store_id: data.store_id || null,
        description: data.description || null,
        location_in_store: data.location_in_store || null,
      });
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Shelf</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shelf Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Aisle 3 - Beverages" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="store_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a store" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
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
              name="location_in_store"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location in Store (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Near entrance, Aisle 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add notes about this shelf..." 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="glow" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Shelf
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
