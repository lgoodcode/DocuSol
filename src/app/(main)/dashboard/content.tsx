"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, FileText, Send, Sparkles, Upload, User } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

type Template = {
  name: string;
  description: string;
  goal: string;
  model: "gpt-4o" | "gpt-4o-mini" | "sonnet-3.5-pro";
};

const templates: Template[] = [
  {
    name: "SEO Writer",
    description: "Generate SEO-optimized content for your website or blog",
    goal: "Create engaging, SEO-friendly content that ranks well in search engines and provides value to readers",
    model: "gpt-4o",
  },
  {
    name: "Start-up Podcast",
    description:
      "Generate podcast scripts and show notes for startup-focused content",
    goal: "Create compelling podcast content that discusses startup trends, interviews, and insights",
    model: "gpt-4o",
  },
  {
    name: "Competitor Analysis",
    description: "Analyze competitors and create detailed comparison reports",
    goal: "Research and analyze key competitors to identify market opportunities and potential threats",
    model: "gpt-4o",
  },
  {
    name: "Market Segmentation",
    description: "Identify and analyze market segments for targeted strategies",
    goal: "Break down market segments and create detailed profiles for each target audience",
    model: "sonnet-3.5-pro",
  },
  {
    name: "Travel Planner",
    description: "Generate detailed travel itineraries and guides",
    goal: "Create comprehensive travel plans including destinations, activities, and recommendations",
    model: "gpt-4o-mini",
  },
  {
    name: "See More",
    description: "Explore more templates",
    goal: "",
    model: "gpt-4o",
  },
];

export function DashboardContent() {
  const { toast } = useToast();
  const [agentLoading, setAgentLoading] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [documentName, setDocumentName] = useState("");
  const [goal, setGoal] = useState("");

  const handleSubmit =
    (type: "document" | "chat" | "agent") => async (e: React.FormEvent) => {
      e.preventDefault();
      // Random between 5-10 seconds
      const delay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;

      if (type === "document") {
        setDocumentLoading(true);
      } else if (type === "chat") {
        setChatLoading(true);
      } else if (type === "agent") {
        setAgentLoading(true);
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, delay));
        throw new Error("Failed to process your request");
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Something went wrong. Please try again later.",
        });
      } finally {
        if (type === "document") {
          setDocumentLoading(false);
        } else if (type === "chat") {
          setChatLoading(false);
        } else if (type === "agent") {
          setAgentLoading(false);
        }
      }
    };

  const handleTemplateClick = (template: Template) => {
    if (template.name === "See More") {
      toast({
        title: "Coming Soon",
        description: "More templates will be available soon!",
      });
      return;
    }
    setSelectedTemplate(template);
    setDocumentName(`ResearchAI - ${template.name}`);
    setGoal(template.goal);
  };

  return (
    <div className="grid gap-8">
      <Tabs defaultValue="agent" className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b border-stone-500 dark:border-stone-800 rounded-none h-12 p-0">
          <TabsTrigger
            value="agent"
            className="rounded-none h-12 px-6 data-[state=active]:bg-zinc-200 hover:bg-zinc-300 dark:hover:bg-accent dark:data-[state=active]:bg-zinc-900 data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Agent
          </TabsTrigger>
          <TabsTrigger
            value="document"
            className="rounded-none h-12 px-6 data-[state=active]:bg-zinc-200 hover:bg-zinc-300 dark:hover:bg-accent dark:data-[state=active]:bg-zinc-900 data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Document
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="rounded-none h-12 px-6 data-[state=active]:bg-zinc-200 hover:bg-zinc-300 dark:hover:bg-accent dark:data-[state=active]:bg-zinc-900 data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Chat
          </TabsTrigger>
        </TabsList>

        {/* Agent Tab */}
        <TabsContent value="agent" className="space-y-8 mt-8">
          <motion.div
            className="grid gap-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.h3 className="text-lg font-medium" variants={item}>
              Templates
            </motion.h3>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
              variants={container}
            >
              {templates.map((template) => (
                <motion.div
                  key={template.name}
                  variants={item}
                  className="h-full w-full"
                >
                  <Card
                    className="cursor-pointer hover:bg-accent h-full w-full transition-colors"
                    onClick={() => handleTemplateClick(template)}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Create Document</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Document Name</label>
                  <Input
                    placeholder="ResearchAI - Competitor Analysis"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Language Model</label>
                  <Select value={selectedTemplate?.model || "gpt-4o"}>
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
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  isLoading={agentLoading}
                  onClick={handleSubmit("agent")}
                >
                  Create Document
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Document Tab */}
        <TabsContent value="document" className="space-y-8 mt-8">
          <div className="grid gap-6">
            {/* AI Document Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate Document with AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contract">
                        Contract Agreement
                      </SelectItem>
                      <SelectItem value="proposal">
                        Business Proposal
                      </SelectItem>
                      <SelectItem value="letter">
                        Professional Letter
                      </SelectItem>
                      <SelectItem value="report">Technical Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prompt</Label>
                  <Textarea
                    placeholder="Describe the document you want to generate..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    className="flex-1"
                    isLoading={documentLoading}
                    onClick={handleSubmit("document")}
                  >
                    Generate Document
                  </Button>
                  <Input
                    type="file"
                    id="fileUpload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById("fileUpload")?.click()
                    }
                  >
                    <Upload className="h-4 w-4" />
                    Upload Reference
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Generations */}
            <div className="grid gap-4">
              <h3 className="text-lg font-medium">Recent Generations</h3>
              <div className="grid gap-4">
                {[
                  {
                    title: "Employment Contract",
                    timestamp: "2 hours ago",
                    status: "Completed",
                  },
                  {
                    title: "Project Proposal",
                    timestamp: "5 hours ago",
                    status: "Completed",
                  },
                  {
                    title: "NDA Agreement",
                    timestamp: "1 day ago",
                    status: "Completed",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.timestamp}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-8">
          <Card>
            <CardContent className="p-0">
              <div className="flex h-[600px] flex-col">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {[
                    {
                      type: "bot",
                      message:
                        "Hello! I'm your document assistant. How can I help improve your documents today?",
                    },
                    {
                      type: "user",
                      message:
                        "Can you help me make this contract more concise?",
                    },
                    {
                      type: "bot",
                      message:
                        "Of course! Please share the contract you'd like me to review, and I'll help you make it more concise while maintaining its legal integrity.",
                    },
                  ].map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex gap-3 ${
                        message.type === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 select-none font-semibold items-center justify-center rounded-md border ${
                          message.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.type === "user" ? (
                          <User className="h-5 w-5" />
                        ) : (
                          <Bot className="h-5 w-5" />
                        )}
                      </div>
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          message.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.message}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="border-t p-4">
                  <form onSubmit={handleSubmit("chat")} className="flex gap-4">
                    <Input
                      placeholder="Type your message..."
                      className="flex-1"
                    />
                    <Button isLoading={chatLoading}>
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send message</span>
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
