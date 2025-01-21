import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function DashboardContent() {
  return (
    <div className="grid gap-8">
      <Tabs defaultValue="agent" className="w-full">
        <TabsList className="w-full justify-start bg-background border-b rounded-none h-12 p-0">
          <TabsTrigger
            value="agent"
            className="rounded-none h-12 px-6 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Agent
          </TabsTrigger>
          <TabsTrigger
            value="document"
            className="rounded-none h-12 px-6 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Document
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="rounded-none h-12 px-6 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Chat
          </TabsTrigger>
        </TabsList>
        <TabsContent value="agent" className="space-y-8 mt-8">
          <div className="grid gap-4">
            <h3 className="text-lg font-medium">Templates</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                "SEO Writer",
                "Start-up Podcast",
                "Competitor Analysis",
                "Market Segmentation",
                "Travel Planner",
                "See More",
              ].map((template) => (
                <Card key={template} className="cursor-pointer hover:bg-accent">
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm">{template}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Create Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Name</label>
                <Input placeholder="ResearchAI - Competitor Analysis" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Language Model</label>
                <Select defaultValue="gpt-4o">
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="sonnet-3.5-pro">
                      Sonnet 3.5 Pro
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Goal</label>
                <Textarea
                  placeholder="Enter your goal..."
                  className="min-h-[100px]"
                />
              </div>
              <Button className="w-full">Create Document</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="document" className="space-y-8 mt-8">
          <div className="min-h-[300px] flex flex-col items-center justify-center">
            <h3 className="text-2xl font-medium">Coming Soon</h3>
          </div>
        </TabsContent>
        <TabsContent value="chat" className="space-y-8 mt-8">
          <div className="min-h-[300px] flex flex-col items-center justify-center">
            <h3 className="text-2xl font-medium">Coming Soon</h3>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
