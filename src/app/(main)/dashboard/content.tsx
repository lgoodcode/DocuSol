"use client";

import { useState, useRef, FormEvent } from "react";
import { motion } from "framer-motion";
import { Bot, FileText, Send, Sparkles, User, Trash2, Download } from "lucide-react";
import { jsPDF } from "jspdf";

import { formatFileSize } from "@/lib/utils/format-file-size";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useFileUpload } from "@/hooks/use-file-upload";

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

type RecentGeneration = {
  title: string;
  timestamp: string;
  status: string;
};

export function DashboardContent() {
  const { toast } = useToast();

  // Loading states for each type
  const [agentLoading, setAgentLoading] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Recent generations (sample only)
  const [recentGenerations] = useState<RecentGeneration[]>([]);

  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // ----- Agent Tab States -----
  // (Same states can be reused or augmented for the "Agent" form if desired)
  const [documentName, setDocumentName] = useState("");
  const [goal, setGoal] = useState("");

  // ----- Document Tab States -----
  // Keep track of the selected doc type and custom prompt
  const [documentType, setDocumentType] = useState("contract");
  const [documentPrompt, setDocumentPrompt] = useState("");

  // ----- Chat Tab States -----
  // Keep a list of all messages in chat
  const [chatMessages, setChatMessages] = useState<
    { type: "user" | "bot"; message: string }[]
  >([
    {
      type: "bot",
      message:
        "Hello! I'm your document assistant. How can I help improve your documents today?",
    },
  ]);
  // Current input in the chat
  const [chatInput, setChatInput] = useState("");

  // Uploaded file
  const { file, handleFileChange, clearFile, fileInputRef } = useFileUpload();

  // The final document generated (Agent or Document tab)
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);

  // ----------------------------------------
  // Common submit handler
  // ----------------------------------------
  const handleSubmit =
    (type: "document" | "chat" | "agent") => async (e: FormEvent) => {
      e.preventDefault();

      // Set loading states
      if (type === "document") {
        setDocumentLoading(true);
      } else if (type === "chat") {
        setChatLoading(true);
      } else if (type === "agent") {
        setAgentLoading(true);
      }

      try {
        // Prepare the fields to send to our API
        let nameToSend = "";
        let goalToSend = "";

        if (type === "agent") {
          // Reuse documentName + goal from Agent tab
          nameToSend = documentName || "Untitled Agent Doc";
          goalToSend = goal;
        } else if (type === "document") {
          // Use doc type + doc prompt
          nameToSend = documentType; // or pass something like: `Document: ${documentType}`
          goalToSend = documentPrompt;
        } else if (type === "chat") {
          // Chat just sends the user's chat input as the "goal"
          nameToSend = "ChatMessage";
          goalToSend = chatInput;
        }

        const response = await fetch("/api/docs/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type,
            documentName: nameToSend,
            goal: goalToSend,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to process your request");
        }

        const data = await response.json();
        const message = data.data.message || "No response received.";

        // For "agent" or "document", we show a single "generatedDocument" in a Card
        if (type === "agent" || type === "document") {
          setGeneratedDocument(message);
          toast({
            title: "Success",
            description: "Your document has been generated successfully!",
          });
        }

        // For "chat", we want to append both the user message and the assistant's response
        if (type === "chat") {
          setChatMessages((prev) => [
            ...prev,
            { type: "user", message: chatInput },
            { type: "bot", message },
          ]);
          // Reset chat input
          setChatInput("");
        }
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Something went wrong. Please try again later.",
        });
      } finally {
        // Clear loading states
        if (type === "document") {
          setDocumentLoading(false);
        } else if (type === "chat") {
          setChatLoading(false);
        } else if (type === "agent") {
          setAgentLoading(false);
        }

        clearFile();
      }
    };

  // ----------------------------------------
  // Download as PDF
  // ----------------------------------------
  const handleDownloadPDF = () => {
    if (!generatedDocument) return;

    const doc = new jsPDF();
    const lines = doc.splitTextToSize(generatedDocument, 180);
    doc.text(lines, 10, 10);
    doc.save(`${documentName || "document"}.pdf`);
  };

  // ----------------------------------------
  // Template click
  // ----------------------------------------
  const handleTemplateClick = (template: Template) => {
    if (template.name === "See More") {
      toast({
        title: "Coming Soon",
        description: "More templates will be available soon!",
      });
      return;
    }
    setSelectedTemplate(template);

    // Pre-fill for Agent tab
    setDocumentName(`ResearchAI - ${template.name}`);
    setGoal(template.goal);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <Badge>Beta</Badge>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Use AI to generate documents, sign them, and share on the blockchain.
          </p>
        </div>
      </motion.div>

      <div className="grid gap-8">
        <Tabs defaultValue="agent" className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
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
          </motion.div>

          {/*
            ----------------------------------------
            AGENT TAB
            ----------------------------------------
          */}
          <TabsContent value="agent" className="space-y-8 mt-8">
            <motion.div
              className="grid gap-4"
              variants={container}
              initial="hidden"
              animate="show"
            >
              <motion.h3
                className="text-lg font-medium"
                variants={item}
                transition={{ delay: 0.1 }}
              >
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
                        <CardTitle className="text-sm">
                          {template.name}
                        </CardTitle>
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
                    <label className="text-sm font-medium">
                      Language Model
                    </label>
                    <Select
                      value={selectedTemplate?.model || "gpt-4o"}
                      onValueChange={(value) => {
                        setSelectedTemplate((prev) =>
                          prev ? { ...prev, model: value as Template["model"] } : prev
                        );
                      }}
                    >
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

            {/* Display Generated Document (Agent) */}
            {generatedDocument && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Generated Document
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="prose max-w-none">
                      {generatedDocument.split("\n").map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recent Generations (Agent) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-lg font-medium">Recent Generations</h3>
              <div className="grid gap-4">
                {!recentGenerations.length ? (
                  <p className="text-sm text-muted-foreground">
                    No recent generations.
                  </p>
                ) : (
                  recentGenerations.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {item.title}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {item.timestamp}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2 flex-shrink-0"
                          >
                            View
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/*
            ----------------------------------------
            DOCUMENT TAB
            ----------------------------------------
          */}
          <TabsContent value="document" className="space-y-6 mt-6 sm:mt-8">
            <div className="grid gap-6">
              {/* AI Document Generation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Generate Document with AI
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <form
                      className="space-y-4"
                      onSubmit={handleSubmit("document")}
                    >
                      <div className="space-y-2">
                        <Label>Document Type</Label>
                        <Select
                          value={documentType}
                          onValueChange={(val) => setDocumentType(val)}
                        >
                          <SelectTrigger className="w-full">
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
                            <SelectItem value="report">
                              Technical Report
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Prompt</Label>
                        <Textarea
                          placeholder="Describe the document you want to generate..."
                          className="min-h-[100px] w-full"
                          value={documentPrompt}
                          onChange={(e) => setDocumentPrompt(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 md:gap-4 justify-end">
                        <Button
                          className="w-full sm:w-auto"
                          isLoading={documentLoading}
                          type="submit"
                        >
                          Generate Document
                        </Button>

                        {/* Upload Reference */}
                        <div className="flex flex-col lg:flex-row gap-2">
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <FileText className="h-4 w-4" />
                            Upload Reference
                          </Button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.txt"
                            className="hidden"
                          />
                          {file && (
                            <div className="flex flex-row gap-4">
                              <Button
                                type="button"
                                variant="destructive"
                                className="px-2"
                                onClick={clearFile}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove file</span>
                              </Button>
                              <div className="space-y-1">
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  Selected: {file.name}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  Size: {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Display Generated Document (Document tab) */}
              {generatedDocument && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Generated Document
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="prose max-w-none">
                        {generatedDocument.split("\n").map((line, idx) => (
                          <p key={idx}>{line}</p>
                        ))}
                      </div>
                      <Button
                        variant="primary"
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Recent Generations (Document) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-lg font-medium">Recent Generations</h3>
                <div className="grid gap-4">
                  {!recentGenerations.length ? (
                    <p className="text-sm text-muted-foreground">
                      No recent generations.
                    </p>
                  ) : (
                    recentGenerations.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card>
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {item.title}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {item.timestamp}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-2 flex-shrink-0"
                            >
                              View
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          </TabsContent>

          {/*
            ----------------------------------------
            CHAT TAB
            ----------------------------------------
          */}
          <TabsContent value="chat" className="mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-0">
                  <div className="flex h-[600px] flex-col">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chatMessages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className={`flex gap-3 ${
                            message.type === "user" ? "flex-row-reverse" : ""
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 select-none items-center justify-center border ${
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
                            className={`px-4 py-2 max-w-[80%] ${
                              message.type === "user"
                                ? "bg-primary text-primary-foreground font-medium"
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
                      <form
                        onSubmit={handleSubmit("chat")}
                        className="flex gap-4"
                      >
                        <Input
                          placeholder="Type your message..."
                          className="flex-1"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                        />
                        <Button type="submit" isLoading={chatLoading}>
                          {!chatLoading && <Send className="h-4 w-4" />}
                          <span className="sr-only">Send message</span>
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
